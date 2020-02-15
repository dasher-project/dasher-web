//
//  Commands.swift
//
// (c) 2020 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT
//

import Foundation

struct Commands {
    struct Ready {
        static let name = "ready"
        struct Ret {
            static let predictorCommands = "predictorCommands"
        }
    }
    struct Predict {
        static let name = "predict"
        struct Args {
            static let input = "input"
        }
        struct Ret {
            static let predictions = "predictions"
        }
    }
}
