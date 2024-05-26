const body = document.querySelector("body"),
        sidebar = body.querySelector(".sidebar"),
        toggle = body.querySelector(".toggle");

        
        toggle.addEventListener("click", () =>{
            if (sidebar.classList.contains("close")){
                sidebar.classList.remove("close");
                sidebar.classList.add("open");
            }
            else{
                sidebar.classList.remove("open");
                sidebar.classList.add("close");
            }
            if (toggle.classList.contains("bx-chevron-right")){
                toggle.classList.remove("bx-chevron-right");
                toggle.classList.add("bx-chevron-left");
            }
            else{
                toggle.classList.remove("bx-chevron-left");
                toggle.classList.add("bx-chevron-right");
            }
        })