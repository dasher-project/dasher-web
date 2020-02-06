//
//  Predictor.swift
//
// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT
//

import UIKit

class Predictor {
    private static let textChecker = UITextChecker()
    
    /// Generates a series of word predictions for the given incomplete word.
    /// Reference: https://nshipster.com/uitextchecker/
    /// - Parameter input: An incomplete word.
    static func predictions(for input: String) -> [String]? {
        return textChecker.completions(forPartialWordRange: NSRange(0..<input.utf16.count), in: input, language: "en_US")
    }
}
