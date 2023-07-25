import { LogProvider } from "../handlers/log.handler";

export const pastebin: LogProvider = {
    hostnames: ["pastebin.com"],
    async parse(url) {
        const id = url.slice(-8)
        console.log(id)
        console.log(`https://pastebin.com/raw/${id}`)
        const res = await fetch(`https://pastebin.com/raw/${id}`)
        if (res.status !== 200) return
        return res.text()
    },
}
