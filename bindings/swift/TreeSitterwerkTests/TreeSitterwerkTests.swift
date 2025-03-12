import XCTest
import SwiftTreeSitter
import TreeSitterwerk

final class TreeSitterwerkTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_werk())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading werk grammar")
    }
}
