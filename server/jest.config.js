module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.ts'],
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            useESM: true,
        }],
    },
    moduleNameMapper: {
        '^(\\.\\.?\\/.+)\\.js$': '$1',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(office-text-extractor|cheerio|parse5|is-html|htmlparser2|domhandler|domutils|entities|dom-serializer|lowlight|decode-named-character-reference|character-entities|character-entities-legacy|character-reference-invalid|character-entities-html4|comma-separated-tokens|space-separated-tokens|hast-util-.+)/)',
    ],
};
