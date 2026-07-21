import AVFoundation
import AppKit

let input = URL(fileURLWithPath: CommandLine.arguments[1])
let output = URL(fileURLWithPath: CommandLine.arguments[2])
let asset = AVURLAsset(url: input)
let duration = CMTimeGetSeconds(asset.duration)
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.maximumSize = NSSize(width: 640, height: 360)
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)

for index in 0..<24 {
    let second = duration * Double(index) / 23
    let image = try generator.copyCGImage(at: CMTime(seconds: second, preferredTimescale: 600), actualTime: nil)
    let bitmap = NSBitmapImageRep(cgImage: image)
    let data = bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.82])!
    try data.write(to: output.appendingPathComponent(String(format: "%02d.jpg", index)))
}
print("duration=\(duration) frames=24")
