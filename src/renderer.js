const body = document.querySelector("body"),
        sidebar = body.querySelector(".sidebar"),
        toggle = body.querySelector(".toggle"),
        notes = body.querySelector(".note"),
        folder_container = body.querySelector(".folder-container");

        
        toggle.addEventListener("click", () =>{
            sidebar.classList.toggle("close");
            folder_container.classList.toggle("close");
            toggle.classList.toggle("close")

            if (toggle.classList.contains("bx-chevron-right")){
                toggle.classList.remove("bx-chevron-right");
                toggle.classList.add("bx-chevron-left");
            }
            else{
                toggle.classList.remove("bx-chevron-left");
                toggle.classList.add("bx-chevron-right");
            }
        })