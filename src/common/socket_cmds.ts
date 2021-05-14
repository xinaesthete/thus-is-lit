/**
 * stuff related to format of messages for passing between clients and server over WebSocket.
 * As of this writing slightly hokey JSON string based.
 * 
 * If I use OSC at some point it will likely be in a very narrow capacity where some other system
 * necessitates it (ie, scsynth).
 */


//Do I want this? Should it be here or in constants?
export enum API {
    Set = "/set", Get = "/get", ModelList = "/model_list", Error = "/error", FragCode = "/fragCode",
    SetParm = "/set_parm", RequestNewRenderer = "/request_new_renderer", RendererAdded = "/renderer_added",
    RegisterRenderer = "/register_renderer", RegisterController = "/register_controller",
    SetVideoFilename = "/vid_file", ReportTime = "/report_time", SeekTime = "/seek_time",
    StarVideo = "/star_video"
}

