use sysinfo::System;
use tauri::{
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{TrayIcon, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, RunEvent,
};
use serde::Serialize;
use std::sync::Mutex;

// Keeps the tray icon alive for the lifetime of the app
struct TrayState(#[allow(dead_code)] TrayIcon);

// ── Data Types ────────────────────────────────────────────────────────────────

#[derive(Serialize, Clone, Debug)]
pub struct SystemStats {
    pub cpu: f32,
    pub ram_used: u64,
    pub ram_total: u64,
    pub battery: Option<f32>,
}

pub struct SysState(pub Mutex<System>);

/// When true, the main window stays open on blur (user pinned it).
pub struct PinWindowState(pub Mutex<bool>);

// ── Tauri Commands ────────────────────────────────────────────────────────────

#[tauri::command]
fn get_system_stats(state: tauri::State<SysState>) -> SystemStats {
    let mut sys = state.0.lock().unwrap();
    sys.refresh_cpu_usage();
    sys.refresh_memory();

    let cpu = sys.global_cpu_usage();
    let ram_used = sys.used_memory();
    let ram_total = sys.total_memory();
    let battery = read_battery_percent();

    SystemStats { cpu, ram_used, ram_total, battery }
}

#[tauri::command]
fn sync_pin_window(state: tauri::State<PinWindowState>, pinned: bool) {
    *state.0.lock().unwrap() = pinned;
}

#[tauri::command]
fn set_tray_state(app: AppHandle, state: String) {
    let icon_bytes: &[u8] = match state.as_str() {
        "focus" => include_bytes!("../icons/tray-focus.png"),
        "break" => include_bytes!("../icons/tray-break.png"),
        _ => include_bytes!("../icons/tray-idle.png"),
    };
    let tooltip = match state.as_str() {
        "focus" => "Luma · Focusing",
        "break" => "Luma · Break time",
        _ => "Luma",
    };
    if let Some(tray) = app.tray_by_id("luma-tray") {
        if let Ok(img) = Image::from_bytes(icon_bytes) {
            let _ = tray.set_icon(Some(img));
        }
        let _ = tray.set_tooltip(Some(tooltip));
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

fn read_battery_percent() -> Option<f32> {
    std::fs::read_to_string("/sys/class/power_supply/BAT0/capacity")
        .ok()
        .and_then(|s| s.trim().parse::<f32>().ok())
}

// Position window near the tray click point, keeping it on screen
fn position_near_anchor(win: &tauri::WebviewWindow, anchor_x: f64, anchor_y: f64) {
    let win_w = 380_i32;
    let win_h = 600_i32;
    let margin = 8_i32;

    if let Ok(Some(monitor)) = win.primary_monitor() {
        let screen = monitor.size();
        let sw = screen.width as i32;
        let sh = screen.height as i32;

        // Prefer placing to the left of the click so it doesn't go off screen
        let mut x = anchor_x as i32 - win_w + 16;
        let mut y = anchor_y as i32 + margin;

        // Clamp to screen bounds
        if x + win_w > sw - margin {
            x = sw - win_w - margin;
        }
        if x < margin {
            x = margin;
        }
        if y + win_h > sh - margin {
            y = anchor_y as i32 - win_h - margin;
        }
        if y < margin {
            y = margin;
        }

        let _ = win.set_position(tauri::PhysicalPosition::new(x, y));
    }
}

fn toggle_window(app: &AppHandle, anchor_x: f64, anchor_y: f64) {
    if let Some(win) = app.get_webview_window("main") {
        if win.is_visible().unwrap_or(false) {
            let _ = win.hide();
        } else {
            position_near_anchor(&win, anchor_x, anchor_y);
            let _ = win.show();
            let _ = win.set_focus();
        }
    }
}

/// Linux tray click events are unreliable; this matches a typical tray corner for the menu action.
fn toggle_window_default_tray_anchor(app: &AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        if let Ok(Some(monitor)) = win.primary_monitor() {
            let screen = monitor.size();
            let sw = screen.width as f64;
            let sh = screen.height as f64;
            toggle_window(app, sw - 40.0, sh - 16.0);
            return;
        }
    }
    toggle_window(app, 100.0, 100.0);
}

// ── App Entry Point ───────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let ctx = tauri::generate_context!();

    let app = tauri::Builder::default()
        .manage(PinWindowState(Mutex::new(false)))
        .manage(SysState(Mutex::new(System::new_all())))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_handle = app.handle().clone();

            // Linux: tray icons often do not render unless a menu exists (Tauri / tray-icon docs).
            let open_item = MenuItem::with_id(
                app,
                "tray-open",
                "Open Luma",
                true,
                Option::<&str>::None,
            )?;
            let quit_item = MenuItem::with_id(
                app,
                "tray-quit",
                "Quit",
                true,
                Option::<&str>::None,
            )?;
            let sep = PredefinedMenuItem::separator(app)?;
            let tray_menu = Menu::with_items(app, &[&open_item, &sep, &quit_item])?;

            let tray_icon = Image::from_bytes(include_bytes!("../icons/tray-idle.png"))?;

            let ah_menu = app_handle.clone();
            let ah_click = app_handle.clone();

            let tray = TrayIconBuilder::with_id("luma-tray")
                .icon(tray_icon)
                .tooltip("Luma")
                .menu(&tray_menu)
                // Left click toggles the window; use the context menu for Open / Quit (esp. on Linux).
                .show_menu_on_left_click(false)
                .on_menu_event(move |_app, event| {
                    if event.id() == "tray-open" {
                        toggle_window_default_tray_anchor(&ah_menu);
                    } else if event.id() == "tray-quit" {
                        ah_menu.exit(0);
                    }
                })
                .on_tray_icon_event(move |_tray, event| {
                    if let TrayIconEvent::Click { position, .. } = event {
                        toggle_window(&ah_click, position.x, position.y);
                    }
                })
                .build(app)?;

            app.manage(TrayState(tray));

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Focused(false) = event {
                if window.label() == "main" {
                    let pinned = window
                        .app_handle()
                        .state::<PinWindowState>()
                        .0
                        .lock()
                        .map(|g| *g)
                        .unwrap_or(false);
                    if !pinned {
                        let _ = window.hide();
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_system_stats,
            set_tray_state,
            sync_pin_window
        ])
        .build(ctx)
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        if let RunEvent::ExitRequested { .. } = event {
            // Hides the indicator early so shutdown / restart dialogs do not flash a stale idle icon.
            if let Some(tray) = app_handle.tray_by_id("luma-tray") {
                let _ = tray.set_visible(false);
            }
        }
    });
}
