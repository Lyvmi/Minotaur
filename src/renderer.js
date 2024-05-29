const body = document.querySelector("body"),
    toggle = body.querySelector(".toggle"),
    folder_container = body.querySelector(".folder-container"),
    note_container = body.querySelector(".note-container"),
    save = body.querySelector(".bxs-save"),
    save_cloud = body.querySelector(".bx-cloud-upload");


toggle.addEventListener("click", () => {
    folder_container.classList.toggle("close");
    toggle.classList.toggle("close");
    note_container.classList.toggle("close");

    if (toggle.classList.contains("bx-chevron-right")) {
        toggle.classList.remove("bx-chevron-right");
        toggle.classList.add("bx-chevron-left");
    }
    else {
        toggle.classList.remove("bx-chevron-left");
        toggle.classList.add("bx-chevron-right");
    }
});

save.addEventListener("click", () => {
    title = body.querySelector('.note-title').value;
    note_body = body.querySelector('.note-body').value;
    console.log("Note saved!");
    console.log(title);
    console.log(note_body);
})
save_cloud.addEventListener("click", () => {
    title = body.querySelector('.note-title').value;
    note_body = body.querySelector('.note-body').value;
    console.log("Note saved!");
    console.log(title);
    console.log(note_body);
})

