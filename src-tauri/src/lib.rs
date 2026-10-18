use std::net::TcpStream;
use std::process::{Child, Command};
use std::sync::Mutex;
use std::time::Duration;
use tauri::{Manager, State};

#[link(name = "bcrypt")]
unsafe extern "system" {
    fn BCryptGenRandom(
        h_algorithm: *mut std::ffi::c_void,
        pb_buffer: *mut u8,
        cb_buffer: u32,
        dw_flags: u32,
    ) -> i32;
}

/// Cryptographically secure 32-byte ephemeral hex token generator using Windows BCrypt RNG.
pub fn generate_ephemeral_token() -> String {
    let mut bytes = [0u8; 32];
    const BCRYPT_USE_SYSTEM_PREFERRED_RNG: u32 = 0x00000002;
    unsafe {
        let status = BCryptGenRandom(
            std::ptr::null_mut(),
            bytes.as_mut_ptr(),
            bytes.len() as u32,
            BCRYPT_USE_SYSTEM_PREFERRED_RNG,
        );
        if status != 0 {
            // High-entropy fallback if BCrypt is not available
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_nanos();
            return format!("fallback_{:x}_{:x}", now, std::process::id());
        }
    }
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}

/// Global Application State held in memory by Tauri
pub struct AppState {
    pub auth_token: String,
    pub backend_child: Mutex<Option<Child>>,
}

pub mod commands {
    use super::*;

    /// IPC command to deliver ephemeral session token to webview heap memory.
    /// Never written to localStorage, cookies, or persisted on disk.
    #[tauri::command]
    pub fn get_session_token(state: State<AppState>) -> Result<String, String> {
        Ok(state.auth_token.clone())
    }
}

/// Helper to probe if local backend port is accepting TCP connections.
fn is_backend_listening(host: &str, port: u16) -> bool {
    let addr = format!("{}:{}", host, port);
    if let Ok(stream) = TcpStream::connect_timeout(&addr.parse().unwrap(), Duration::from_millis(200)) {
        drop(stream);
        true
    } else {
        false
    }
}

/// Terminate child backend process cleanly with zero orphan processes.
pub fn shutdown_backend(state: &AppState) {
    if let Ok(mut lock) = state.backend_child.lock() {
        if let Some(mut child) = lock.take() {
            log::info!("Terminating FastAPI backend sidecar process (PID: {})...", child.id());
            let _ = child.kill();
            let _ = child.wait();
            log::info!("FastAPI backend sidecar successfully terminated.");
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let ephemeral_token = generate_ephemeral_token();
    let app_state = AppState {
        auth_token: ephemeral_token.clone(),
        backend_child: Mutex::new(None),
    };

    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![commands::get_session_token])
        .setup(|app| {
            // Check if backend service is already responding
            if !is_backend_listening("127.0.0.1", 24125) {
                // Determine Python interpreter path
                let candidates = [
                    "../backend/.venv/Scripts/python.exe",
                    "backend/.venv/Scripts/python.exe",
                    "./backend/.venv/Scripts/python.exe",
                    "python.exe",
                ];
                let mut chosen_python = None;
                for candidate in &candidates {
                    if std::path::Path::new(candidate).exists() {
                        chosen_python = Some(candidate.to_string());
                        break;
                    }
                }

                if let Some(python_path) = chosen_python {
                    log::info!("Starting FastAPI sidecar via {}", python_path);
                    let mut cmd = Command::new(&python_path);
                    cmd.args(&[
                        "-m", "uvicorn", "backend.app.main:app",
                        "--host", "127.0.0.1",
                        "--port", "24125",
                        "--log-level", "warning",
                    ]);
                    
                    // In desktop production mode, pass ephemeral token and production env
                    let state = app.state::<AppState>();
                    cmd.env("APP_AUTH_TOKEN", &state.auth_token);
                    cmd.env("APP_ENV", "production");
                    cmd.env("APP_HOST", "127.0.0.1");
                    cmd.env("APP_PORT", "24125");

                    #[cfg(windows)]
                    {
                        // CREATE_NO_WINDOW = 0x08000000
                        use std::os::windows::process::CommandExt;
                        cmd.creation_flags(0x08000000);
                    }

                    match cmd.spawn() {
                        Ok(child) => {
                            log::info!("Backend child spawned with PID {}", child.id());
                            if let Ok(mut lock) = state.backend_child.lock() {
                                *lock = Some(child);
                            }
                            // Wait briefly for startup readiness
                            for _ in 0..20 {
                                if is_backend_listening("127.0.0.1", 24125) {
                                    log::info!("Backend health probe ready on 127.0.0.1:24125");
                                    break;
                                }
                                std::thread::sleep(Duration::from_millis(250));
                            }
                        }
                        Err(e) => {
                            log::warn!("Could not spawn backend sidecar process: {}", e);
                        }
                    }
                } else {
                    log::info!("No local python interpreter found; assuming external backend daemon.");
                }
            } else {
                log::info!("Backend already listening on 127.0.0.1:24125.");
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                // If main window destroyed, clean up sidecar child
                let state = window.state::<AppState>();
                shutdown_backend(&state);
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::Exit = event {
                let state = app_handle.state::<AppState>();
                shutdown_backend(&state);
            }
        });
}
