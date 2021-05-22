const storage = require('electron-json-storage-sync');
const path = require("path");
const os = require('os');
const { getDrives } = require('./drives');
const getPreview = require('../Functions/preview/preview');

const changeSidebar = newElement => {
    const sidebarElement = document.body.querySelector(".sidebar");
    sidebarElement.parentElement.replaceChild(newElement, sidebarElement);
    return;
}

const getDriveBasePath = mounted => {
    return process.platform === "win32" ? escape(path.resolve(mounted, "/")) : escape(mounted)
}

const createSidebar = () => {
    // Functions to get favorites element
    const favoritesElement = favorites => {
        let result = ""
        for (const favorite of favorites) {
            result += `<span data-listenOpen data-path = "${path.join(os.homedir(), favorite)}" data-isdir="true" class="sidebar-hover-effect"><img src="${getPreview(favorite, category = 'sidebar', HTMLFormat = false)}" alt="${favorite} icon"> ${favorite}</span>`
        }
        return result;
    }

    // Functions to get and display drives on sidebar
    const getDrivesElement = async () => {
        const drives = await getDrives()
        if (!drives.length || process.platform === "darwin") return `<div class="sidebar-nav-item" id="sidebar-drives"></div>` // Return basic sidebar item element if there's no drives detected or its running on macOS
        else {
            let drivesElement = ""
            for (const drive of drives) {
                let driveName = process.platform === "win32" ? `${drive._volumename} (${drive._mounted})` : drive._mounted.split("/")[drive._mounted.split("/").length - 1] // Get name of drive
                drivesElement += `<span data-listenOpen data-path = "${getDriveBasePath(drive._mounted)}" data-isdir="true" class="sidebar-hover-effect"><img src="${getPreview('usb', category = 'favorites', HTMLFormat = false)}" alt="${driveName}">${driveName}</span>`
            }
            let result = `<div class="sidebar-nav-item" id="sidebar-drives">
                <div class="sidebar-hover-effect">
                <span class="sidebar-nav-item-dropdown-btn"><img src="${getPreview('usb', category = "favorites", HTMLFormat = false)}" alt="Drives icon"> ${process.platform === "win32" ? "Drives" : "Pendrives"}</span>
                </div>
                <div class="sidebar-nav-item-dropdown-container">
                    ${drivesElement}
                </div>
            </div>`
            return result;
        }
    }

    const { data } = storage.get('sidebar'); // Get user favorites data on sidebar

    let _favorites = ['Home', 'Recent', 'Desktop', 'Documents', 'Downloads', 'Pictures', 'Music', 'Videos', 'Trash']
    // If user has no preference sidebar item
    if (!data || !Object.keys(data).length || !data.favorites.length) {
        storage.set('sidebar', { favorites: _favorites })
    }
    else {
        _favorites = data.favorites
    }

    getDrivesElement().then(drivesElement => { // get drives element
        console.log(drivesElement)
        let sidebarElement = document.createElement("div");
        sidebarElement.classList.add("sidebar")
        sidebarElement.innerHTML = `
        <span class="xplorer-brand">Xplorer</span>
        <div class="sidebar-nav">
            <div class="sidebar-nav-item">
                <div class="sidebar-hover-effect">
                    <span class="sidebar-nav-item-dropdown-btn"><img src="${getPreview('Favorites', category = "sidebar", HTMLFormat = false)}" alt="Favorites icon"> Favorites</span>
                </div>
                <div class="sidebar-nav-item-dropdown-container">
                    ${favoritesElement(_favorites)}
                </div>
            </div>
            ${drivesElement}
        </div>
        <div class="sidebar-setting-btn sidebar-hover-effect">
            <div class="sidebar-setting-btn-inner">
                <img src="${getPreview('setting', category = 'sidebar', HTMLFormat = false)}" alt="Setting icon" class="sidebar-setting-btn-icon">
                <span class="sidebar-setting-btn-text">Settings</span>
            </div>
        </div>`

        // Collapse section
        sidebarElement.querySelectorAll(".sidebar-nav-item-dropdown-btn").forEach(btn => {
            btn.addEventListener("click", e => {
                e.target.parentNode.classList.toggle('nav-hide-item')
            })
        })
        changeSidebar(sidebarElement)

        // Listen drives change
    })
    let _prevDrives;
    setInterval(() => {
        getDrivesElement().then(_drives => {
            if (_prevDrives === undefined) _prevDrives = _drives
            else {
                //console.log(_prevDrives !== _drives)
                if (_drives !== _prevDrives) {
                    const _newElement = document.createElement("div")
                    _newElement.innerHTML = _drives.trim()
                    document.getElementById("sidebar-drives").parentNode.replaceChild(_newElement.firstChild, document.getElementById("sidebar-drives"))
                }
                _prevDrives = _drives
            }
        })
    }, 500);
    return;
}

module.exports = createSidebar