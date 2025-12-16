import { invoke } from "@tauri-apps/api/core";
import { check } from "@tauri-apps/plugin-updater";
import { ask, message } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";

let greetInputEl: HTMLInputElement | null;
let greetMsgEl: HTMLElement | null;
let updateStatusEl: HTMLElement | null;

async function greet() {
  if (greetMsgEl && greetInputEl) {
    greetMsgEl.textContent = await invoke("greet", {
      name: greetInputEl.value,
    });
  }
}

async function checkForUpdates() {
  if (updateStatusEl) {
    updateStatusEl.textContent = "Checking for updates...";
  }

  try {
    const update = await check();

    if (update) {
      console.log(`Update available: ${update.version}`);
      
      const yes = await ask(
        `Update to version ${update.version} is available!\n\nRelease notes:\n${update.body || "No release notes"}`,
        {
          title: "Update Available",
          kind: "info",
          okLabel: "Update Now",
          cancelLabel: "Later",
        }
      );

      if (yes) {
        if (updateStatusEl) {
          updateStatusEl.textContent = "Downloading update...";
        }

        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case "Started":
              console.log(`Download started: ${event.data.contentLength} bytes`);
              if (updateStatusEl) {
                updateStatusEl.textContent = "Downloading...";
              }
              break;
            case "Progress":
              console.log(`Downloaded ${event.data.chunkLength} bytes`);
              break;
            case "Finished":
              console.log("Download finished");
              if (updateStatusEl) {
                updateStatusEl.textContent = "Installing...";
              }
              break;
          }
        });

        if (updateStatusEl) {
          updateStatusEl.textContent = "Update installed! Restarting...";
        }
        await relaunch();
      } else {
        if (updateStatusEl) {
          updateStatusEl.textContent = "Update skipped";
        }
      }
    } else {
      if (updateStatusEl) {
        updateStatusEl.textContent = "You're on the latest version!";
      }
      await message("You are on the latest version.", {
        title: "No Update Available",
        kind: "info",
      });
    }
  } catch (error) {
    console.error("Update check failed:", error);
    if (updateStatusEl) {
      updateStatusEl.textContent = `Update check failed: ${error}`;
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  greetInputEl = document.querySelector("#greet-input");
  greetMsgEl = document.querySelector("#greet-msg");
  updateStatusEl = document.querySelector("#update-status");

  document.querySelector("#greet-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    greet();
  });

  document.querySelector("#check-update")?.addEventListener("click", () => {
    checkForUpdates();
  });
});
