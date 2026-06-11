import { execFile, spawn, type ExecFileOptions, type SpawnOptions } from "node:child_process"

export function hiddenExecFileOptions(options: ExecFileOptions = {}): ExecFileOptions {
  if (process.platform !== "win32" || Object.prototype.hasOwnProperty.call(options, "windowsHide")) {
    return options
  }
  return { ...options, windowsHide: true }
}

export function hiddenSpawnOptions<T extends SpawnOptions>(options: T = {} as T): T {
  if (process.platform !== "win32" || Object.prototype.hasOwnProperty.call(options, "windowsHide")) {
    return options
  }
  return { ...options, windowsHide: true }
}

export function hiddenExecFile(
  file: string,
  args: readonly string[] | null | undefined,
  options: ExecFileOptions,
  callback: Parameters<typeof execFile>[3],
) {
  return execFile(file, args, hiddenExecFileOptions(options), callback)
}

export function execFileHidden(command: string, args: string[]) {
  return new Promise<{ stdout: string | Buffer; stderr: string | Buffer }>((resolve, reject) => {
    execFile(command, args, hiddenExecFileOptions(), (error, stdout, stderr) => {
      if (error) return reject(error)
      resolve({ stdout, stderr })
    })
  })
}

export function hiddenSpawn(command: string, args: readonly string[], options?: SpawnOptions) {
  return spawn(command, args, hiddenSpawnOptions(options))
}

export function spawnHidden(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = hiddenSpawn(command, args, { stdio: "ignore" })
    child.once("error", reject)
    child.once("spawn", () => {
      Promise.resolve()
        .then(() => child.unref())
        .then(() => resolve(), reject)
    })
  })
}

export function openPathWithApp(path: string, app: string) {
  // Windows GUI apps should resolve after launch; waiting for exit would keep Desktop tied to the launched app.
  if (process.platform === "win32") return spawnHidden(app, [path])
  const [cmd, args] = process.platform === "darwin" ? (["open", ["-a", app, path]] as const) : ([app, [path]] as const)
  return execFileHidden(cmd, [...args]).then(() => undefined)
}
