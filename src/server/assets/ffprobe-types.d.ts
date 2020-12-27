// /**
//  * Analyzes a video with ffprobe
//  * @func    ffprobe
//  * @param   {String} target   The file path or remote URL of the video
//  * @param   {Object} [config={}]             A configuration object
//  * @param   {String} [config.path='ffprobe'] Path of the ffprobe binary
//  * @returns {Promise<Object>} Promise that resolves to the ffprobe JSON output
//  */
// function ffprobe (target, config = {}) {
//   const path = config.path || process.env.FFPROBE_PATH || 'ffprobe'
//   const args = [
//     '-show_streams',
//     '-show_format',
//     '-print_format',
//     'json',
//     target
//   ]

//   return ffprobeExecFile(path, args)
// }


declare module 'ffprobe-client' {
    //this is the extent of the interface, but adding it doesn't seem to be making any difference?
    export default function ffprobe(target: string, config?: {path?: string}) : Promise<any>
}
declare module '@ffprobe-installer/ffprobe'