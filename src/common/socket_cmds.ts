/**
 * stuff related to format of messages for passing between clients and server over WebSocket.
 * As of this writing slightly hokey JSON string based.
 * 
 * If I use OSC at some point it will likely be in a very narrow capacity where some other system
 * necessitates it (ie, scsynth).
 */


//Do I want this? Should it be here on in constants?
export enum OscCommandType {
    Set = "/set", Get = "/get", ModelList = "/model_list",
    RegisterRenderer = "/register_renderer", RegisterController = "/register_controller",
    SetVideoFilename = "/vid_file", ReportTime = "/report_time", SeekTime = "/seek_time"
}

type LitMsg = string;

export function makeRegisterRendererMessage(id: number) : LitMsg {
    return JSON.stringify({address: OscCommandType.RegisterRenderer, id: id});
}
export function makeRegisterControllerMessage() : LitMsg {
    return JSON.stringify({address: OscCommandType.RegisterController});
}

// export function makeSetVideoFilenameMessage(id: number, filename: string) : LitMsg {
//     return JSON.stringify({address: OscCommandType.SetVideoFilename, id: id, filename: filename});
// }
