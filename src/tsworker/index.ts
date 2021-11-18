// @ts-ignore
const params = new URLSearchParams(self.search)

if(!params.get("version"))  {throw new Error("Did not get a version in the query for TypeScript") }

importScripts(`https://typescript.azureedge.net/cdn/${params.get("version")}/typescript/lib/typescript.js`)

// @ts-ignore
console.log(ts)