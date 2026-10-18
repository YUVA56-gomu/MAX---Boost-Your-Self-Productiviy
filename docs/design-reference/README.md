# Design Reference Assets Directory

This directory contains the authoritative visual reference images and screenshots for the **Adaptive Productivity Desktop Application**.

---

## 1. Approved Visual Reference Registry

| Filename | Role / Description | Status in Workspace |
| :--- | :--- | :--- |
| **`dashboard-reference.png`** | **Primary Approved Visual Source of Truth**. High-fidelity Gemini-inspired dark dashboard establishing the shell layout, obsidian palette, typography, glassmorphism cards, stat metrics, task list, focus timer HUD, and weekly analytics. | Expected at: `docs/design-reference/dashboard-reference.png` *(Awaiting manual placement)* |
| **`geometric-artwork-reference.png`** | **Approved Geometric Art & Iconography Source**. Reference library of colorful geometric clover logo, ribbon springs, isometric gradient blocks, polyhedra, and torus shapes for headers and brand accents. | Optional reference asset |

---

## 2. Reference Image Governance Rules

1. **Primary Source of Truth**:
   - `dashboard-reference.png` serves as the primary visual target and benchmark for all screens.
   - All subsequent screens must inherit the visual identity, tokens, spacing, and component styling established in this reference.
2. **Strict Immutability**:
   - **Never rename, overwrite, delete, or replace an approved reference image without explicit permission.**
   - Approved references reflect signed-off product design decisions.
3. **Adding New Screenshots**:
   - Additional screen mockups, component states, or workflow captures can be added to this directory as development progresses.
   - Every newly added reference image must be registered and documented in [`UI.md`](file:///d:/SelfProductivityApp/UI.md).
4. **Target Image Placement**:
   - Please manually place the approved dashboard reference image at:
     ```text
     d:\SelfProductivityApp\docs\design-reference\dashboard-reference.png
     ```
   - Automated scripts and agents will verify its presence before claiming inspection.
