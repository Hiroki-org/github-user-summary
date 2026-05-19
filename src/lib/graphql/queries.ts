export const REPOSITORIES_QUERY = `query($login: String!) {
  user(login: $login) {
    repositories(first: 100, ownerAffiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR], orderBy: {field: STARGAZERS, direction: DESC}, isFork: false, privacy: PUBLIC) {
      totalCount
      nodes {
        name
        description
        url
        stargazerCount
        forkCount
        isFork
        primaryLanguage { name color }
        languages(first: 10) {
          edges {
            size
            node { name color }
          }
        }
        repositoryTopics(first: 10) {
          nodes {
            topic { name }
          }
        }
      }
    }
  }
}`;

export const CONTRIBUTIONS_QUERY = `query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalPullRequestReviewContributions
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
  }
}`;

export const YEAR_IN_REVIEW_QUERY = `query($login: String!, $from: DateTime!, $to: DateTime!, $maxRepositories: Int!) {
  user(login: $login) {
    id
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalPullRequestReviewContributions
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
      commitContributionsByRepository(maxRepositories: $maxRepositories) { ...repoFields }
      pullRequestContributionsByRepository(maxRepositories: $maxRepositories) { ...repoFields }
      issueContributionsByRepository(maxRepositories: $maxRepositories) { ...repoFields }
    }
  }
}
fragment repoFields on ContributionsByRepository {
  repository {
    name
    owner { login }
  }
  contributions { totalCount }
}`;
