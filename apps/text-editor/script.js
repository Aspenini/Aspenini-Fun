document.getElementById("fileInput").addEventListener("change", function(event) {
    let file = event.target.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById("editor").value = e.target.result;
            document.getElementById("fileName").innerText = file.name;
        };
        reader.readAsText(file);
    }
});

function saveFile() {
    let text = document.getElementById("editor").value;
    let filename = document.getElementById("fileName").innerText;
    if (filename === "No file loaded") filename = "new_file.txt";
    
    let blob = new Blob([text], { type: "text/plain" });
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
