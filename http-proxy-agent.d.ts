// declare module 'https-proxy-agent' {
//     import * as https from 'https'

//     namespace HttpProxyAgent {
//         interface HttpProxyAgentOptions {
//             host: string
//             port: number
//             secureProxy?: boolean
//             headers?: {
//                 [key: string]: string
//             }
//             [key: string]: any
//         }
//     }
    
//     // HttpProxyAgent doesnt *actually* extend https.Agent, but for my purposes I want it to pretend that it does
//     class HttpProxyAgent extends https.Agent {
//         constructor(opts: HttpProxyAgent.HttpProxyAgentOptions)
//     }

//     export = HttpProxyAgent
// }