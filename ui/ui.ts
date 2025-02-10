document.addEventListener("DOMContentLoaded", () => {
  console.log("UI script loaded");
  window.parent.postMessage(
    { pluginMessage: { type: "test" } },
    "*"
  );

  const fetchBtn = document.getElementById("fetch-btn");
  if (fetchBtn) {
    fetchBtn.addEventListener("click", () => {
      console.log("Button clicked");
      window.parent.postMessage(
        { pluginMessage: { type: "fetch-content" } },
        "*"
      );
    });
  } else {
    console.error("Fetch button not found in the DOM");
  }
});

window.onmessage = (event) => {
  console.log("Message received from plugin:", event.data.pluginMessage);
  
  const message = event.data.pluginMessage;
  if (message?.type === "content") {
    document.getElementById("content")!.textContent = JSON.stringify(message.data, null, 2);
  } else if (message?.type === "error") {
    document.getElementById("content")!.textContent = `Error: ${message.error}`;
  }
};
