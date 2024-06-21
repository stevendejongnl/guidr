const noteKeywords = [
  'BREAKING CHANGE',
  'BREAKING CHANGES',
  'BREAKING'
]

const rules = [
  {
    name: 'Feature',
    description: 'A new feature',
    types: ['feat', 'Feat'],
    section: '✨ Feature',
    release: 'minor',
    hidden: false,
  }, {
    name: 'Bugfix',
    description: 'A bug fix',
    types: ['fix', 'Fix'],
    section: '🐛 Bugfix',
    release: 'patch',
    hidden: false,
  }, {
    name: 'Documentation',
    description: 'Documentation only changes',
    types: ['docs', 'Docs'],
    section: '📖 Documentation',
    release: false,
    hidden: false,
  }, {
    name: 'Style',
    description: 'Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)',
    types: ['style', 'Style'],
    section: '🛠️ Maintenance',
    release: false,
    hidden: false,
  }, {
    name: 'Refactor',
    description: 'A code change that neither fixes a bug nor adds a feature',
    types: ['refactor', 'Refactor'],
    section: '🏗️ Refactor',
    release: false,
    hidden: false,
  }, {
    name: 'Performance',
    description: 'A code change that improves performance',
    types: ['perf', 'Perf'],
    section: '🚀 Performance',
    release: 'patch',
    hidden: false,
  }, {
    name: 'Tests',
    description: 'Adding missing or correcting existing tests',
    types: ['test', 'Test'],
    section: '🧪 Tests',
    release: false,
    hidden: false,
  }, {
    name: 'Maintenance',
    description: 'Changes to the build process or auxiliary tools and libraries such as documentation generation',
    types: ['chore', 'Chore'],
    section: '🛠️ Maintenance',
    release: false,
    hidden: false,
  },
]

const splitRules = []
for (const rule of rules) {
  for (const type of rule.types) {
    splitRules.push({
      type: type,
      release: rule.release,
      section: rule.section,
      hidden: rule.hidden,
    })
  }
}

/**
 * @type {import('semantic-release').GlobalConfig}
 */
module.exports = {
  branches: [
    { name: 'main' },
    { name: 'next' },
  ],
  repositoryUrl: 'git@github.com:stevendejongnl/MadeBySteven.git',
  preset: 'conventionalcommits',
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        'releaseRules': [
          ...splitRules.map((rule) => ({
            'type': rule.type,
            'release': rule.release,
          })),
        ],
        'parserOpts': {
          'noteKeywords': noteKeywords,
        }
      }
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        'parserOpts': {
          'noteKeywords': noteKeywords,
        },
        'presetConfig': {
          'types': [
            ...splitRules.map((rule) => ({
              'type': rule.type,
              'section': rule.section,
              'hidden': rule.hidden,
            })),
          ]
        }
      }
    ],
    [
      '@semantic-release/changelog',
      {
        'changelogFile': 'CHANGELOG.md'
      }
    ],
    [
      '@semantic-release/npm',
      {
        'npmPublish': false
      }
    ],
    [
      '@semantic-release/git',
      {
        'assets': ['CHANGELOG.md', 'package.json', 'package-lock.json'],
        'message': 'chore(release): Bump version to ${nextRelease.version} \n\n${nextRelease.notes}'
      }
    ],
    [
      '@semantic-release/github'
    ]
  ],
  ci: true,
  debug: false,
  dryRun: false,
}
