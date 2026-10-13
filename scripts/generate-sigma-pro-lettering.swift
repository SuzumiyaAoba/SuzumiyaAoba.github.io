// Converts local font outlines into polygon paths. No raster image is produced.
// Run from the repository root: rtk proxy swift scripts/generate-sigma-pro-lettering.swift
import CoreText
import Foundation

func fontData(_ name: String, characters: String) -> [String: Any] {
    let font = CTFontCreateWithName(name as CFString, 1000, nil)
    var glyphs: [String: Any] = [:]
    for character in Set(characters).sorted() {
        var unicode = Array(String(character).utf16)[0]
        var glyph: CGGlyph = 0
        CTFontGetGlyphsForCharacters(font, &unicode, &glyph, 1)
        var advance = CGSize.zero
        CTFontGetAdvancesForGlyphs(font, .horizontal, &glyph, &advance, 1)
        var outline: [String] = []
        var bounds = CGRect.zero
        if let path = CTFontCreatePathForGlyph(font, glyph, nil) {
            bounds = path.boundingBoxOfPath
            path.applyWithBlock { pointer in
                let element = pointer.pointee
                func point(_ index: Int) -> [String] {
                    let p = element.points[index]
                    return [String(Int(p.x.rounded())), String(Int(p.y.rounded()))]
                }
                switch element.type {
                case .moveToPoint: outline += ["m"] + point(0)
                case .addLineToPoint: outline += ["l"] + point(0)
                case .addQuadCurveToPoint: outline += ["q"] + point(1) + point(0)
                case .addCurveToPoint: outline += ["b"] + point(2) + point(0) + point(1)
                case .closeSubpath: break
                @unknown default: break
                }
            }
        }
        glyphs[String(character)] = [
            "ha": Int(advance.width.rounded()),
            "x_min": Int(bounds.minX.rounded()),
            "x_max": Int(bounds.maxX.rounded()),
            "o": outline.joined(separator: " ")
        ]
    }
    return [
        "glyphs": glyphs,
        "familyName": name,
        "ascender": 1000, "descender": -300,
        "underlinePosition": -100, "underlineThickness": 50,
        "boundingBox": ["yMin": -300, "xMin": 0, "yMax": 1000, "xMax": 1000],
        "resolution": 1000,
        "original_font_information": ["source": "Local CoreText vector outlines; no bitmap"]
    ]
}

let fonts = [
    "sans": fontData("ArialMT", characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 /.-+?"),
    "serif": fontData("TimesNewRomanPSMT", characters: "SIGMA Pro?"),
    "wordmark": fontData("Optima-Regular", characters: "Questyle?")
]
let data = try JSONSerialization.data(withJSONObject: fonts, options: [.prettyPrinted, .sortedKeys])
let destination = URL(fileURLWithPath: "src/foundation/pages/audio/ui/scene/sigma-pro-fonts.json")
try data.write(to: destination)
print("Wrote vector glyph outlines to \(destination.path)")
