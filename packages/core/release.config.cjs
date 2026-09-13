module.exports = {
    extends: 'semantic-release-monorepo',
    branches: [
        'main',
        {
            name: 'beta',
            prerelease: true,
        },
    ],
    plugins: [
        '@semantic-release/commit-analyzer',
        '@semantic-release/release-notes-generator',
        [
            '@semantic-release/exec',
            {
                // Direct package.json mutation that bypasses pnpm's git tree checks
                prepareCmd: 'pnpm pkg set version=${nextRelease.version}',
            },
        ],
        [
            '@semantic-release/npm',
            {
                // Publishes the package to npm using the version set above
                npmPublish: true,
                pkgRoot: '.',
            },
        ],
        '@semantic-release/github',
    ],
};