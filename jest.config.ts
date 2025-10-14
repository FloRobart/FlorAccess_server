import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',

    // Emplacement des fichiers de tests
    roots: ['<rootDir>/tests/'],

    // Motif de nommage des fichiers de tests
    testRegex: ".*\\.spec\\.ts$",

    // Mappe les alias TypeScript aux chemins réels
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1" // (@ --> src/)
    },

    // Fichier exécuté avant les tests (setup global)
    setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],

    // Options utiles
    clearMocks: true, // Réinitialise les mocks entre chaque test
    verbose: true, // Affiche des informations détaillées lors de l'exécution des tests

    // Configuration de la couverture de code
    collectCoverage: false, // Active la collecte de couverture de code
    coverageDirectory: "coverage", // Répertoire de sortie pour les rapports de couverture
    coverageReporters: ["text", "lcov"], // Formats de rapport de couverture
    collectCoverageFrom: [ // Fichiers à inclure dans la couverture
        "<rootDir>/src/**/*.ts", // Inclure tous les fichiers TypeScript dans src
        "!<rootDir>/src/app.ts", // Exclure le fichier d'entrée principal
        "!<rootDir>/src/server.ts", // Exclure les fichiers index
        "!<rootDir>/src/swagger/**", // Exclure les fichiers Swagger
        "!<rootDir>/src/config/**", // Exclure les fichiers de configuration
        "!<rootDir>/src/**/*.types.ts", // Exclure les fichiers de types
    ]
};

export default config;
