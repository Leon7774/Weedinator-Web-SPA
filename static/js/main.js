const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const predictBtn = document.getElementById("predict-btn");
const resultContainer = document.getElementById("result-container");
const resultImage = document.getElementById("result-image");
let selectedFile = null;

// Handle drag and drop
dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.style.borderColor = "var(--primary)";
});

dropZone.addEventListener("dragleave", () => {
  dropZone.style.borderColor = "#475569";
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.style.borderColor = "#475569";
  if (e.dataTransfer.files.length) {
    handleFile(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener("change", (e) => {
  if (e.target.files.length) {
    handleFile(e.target.files[0]);
  }
});

function handleFile(file) {
  if (!file.type.startsWith("image/")) {
    alert("Please upload an image file");
    return;
  }
  selectedFile = file;
  predictBtn.textContent = `Run Detection on ${file.name}`;
  predictBtn.disabled = false;

  // Preview original
  const reader = new FileReader();
  reader.onload = (e) => {
    resultImage.src = e.target.result;
    resultContainer.style.display = "block";
  };
  reader.readAsDataURL(file);
}

predictBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  predictBtn.disabled = true;
  predictBtn.textContent = "Processing...";

  const formData = new FormData();
  formData.append("image", selectedFile);

  const modelSelector = document.getElementById("model-selector");
  formData.append("model", modelSelector.value);

  try {
    const response = await fetch("/predict", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Prediction failed");

    const data = await response.json();

    if (data.error) throw new Error(data.error);

    // Update image
    resultImage.src = `data:image/jpeg;base64,${data.image}`;
    resultContainer.style.display = "block";

    // Display JSON output
    const jsonOutput = document.getElementById("json-output");
    const jsonContainer = document.getElementById("json-output-container");

    jsonOutput.textContent = JSON.stringify(data.detections, null, 2);
    jsonContainer.style.display = "block";

    predictBtn.textContent = "Run Detection";
    predictBtn.disabled = false;
  } catch (error) {
    console.error("Error:", error);
    alert("Error processing image");
    predictBtn.textContent = "Retry";
    predictBtn.disabled = false;
  }
});
