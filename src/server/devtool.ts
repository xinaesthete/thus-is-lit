// import installExtension, {REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer'


//https://www.electronjs.org/docs/tutorial/devtools-extension
//react devtools extension path:
//"C:\Users\peter\AppData\Local\Google\Chrome\User Data\Default\Extensions\fmkadmapgofadopljbjfkapdkoienihi\4.10.1_0"

//(node:30672) ExtensionLoadWarning: Warnings loading extension at C:\Users\peter\AppData\Roaming\thus-is-lit\extensions\fmkadmapgofadopljbjfkapdkoienihi: 
//Unrecognized manifest key 'browser_action'. Unrecognized manifest key 'minimum_chrome_version'. Unrecognized manifest key 'update_url'. 
//Cannot load extension with file or directory name _metadata. Filenames starting with "_" are reserved for use by the system.

export default async function installReactDevtool() {
    // try {
    //     //DANGER, DANGER... HIGH VOLTAGE!! (likely to cause problems building / running elsewhere if care not taken.)
    //     //not working anyway on my machine as of this writing.
    //     await installExtension(REACT_DEVELOPER_TOOLS);
    //     //setTimeout(()=>installExtension(REACT_DEVELOPER_TOOLS), 5000);
    // } catch (e) {
    //     console.error("Failed to install react devtools");
    // }
}
