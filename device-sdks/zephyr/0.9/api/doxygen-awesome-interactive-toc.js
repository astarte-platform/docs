/*
 * (C) Copyright 2024, SECO Mind Srl
 *
 * SPDX-License-Identifier: MIT
 */

class DoxygenAwesomeInteractiveToc {
    static topOffset = 38
    static hideMobileMenu = true
    static headers = []

    static init() {
        window.addEventListener("load", () => {
            let toc = document.querySelector(".contents > .toc")
            if(toc) {
                toc.classList.add("interactive")
                if(!DoxygenAwesomeInteractiveToc.hideMobileMenu) {
                    toc.classList.add("open")
                }
                document.querySelector(".contents > .toc > h3")?.addEventListener("click", () => {
                    if(toc.classList.contains("open")) {
                        toc.classList.remove("open")
                    } else {
                        toc.classList.add("open")
                    }
                })

                document.querySelectorAll(".contents > .toc > ul a").forEach((node) => {
                    let id = node.getAttribute("href").substring(1)
                    DoxygenAwesomeInteractiveToc.headers.push({
                        node: node,
                        headerNode: document.getElementById(id)
                    })

                    document.getElementById("doc-content")?.addEventListener("scroll", () => {
                        DoxygenAwesomeInteractiveToc.update()
                    })
                })
                DoxygenAwesomeInteractiveToc.update()
            }
        })
    }

    static update() {
        let active = DoxygenAwesomeInteractiveToc.headers[0]?.node
        DoxygenAwesomeInteractiveToc.headers.forEach((header) => {
            let position = header.headerNode.getBoundingClientRect().top
            header.node.classList.remove("active")
            header.node.classList.remove("aboveActive")
            if(position < DoxygenAwesomeInteractiveToc.topOffset) {
                active = header.node
                active?.classList.add("aboveActive")
            }
        })
        active?.classList.add("active")
        active?.classList.remove("aboveActive")
    }
}
