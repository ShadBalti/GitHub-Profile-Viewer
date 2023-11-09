// Function to fetch and display user profile
async function fetchProfile() {
  const username = document.getElementById('searchInput').value;
  const userInfoContainer = document.getElementById('userInfo');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const errorMessage = document.getElementById('errorMessage');

  // Reset previous state
  userInfoContainer.innerHTML = '';
  errorMessage.innerHTML = '';
  loadingIndicator.style.display = 'block';

  try {
    const response = await fetch(`https://api.github.com/users/${username}`);

    if (!response.ok) {
      throw new Error('User not found');
    }

    const userData = await response.json();

    // Display user information
    userInfoContainer.innerHTML = `
      <img src="${userData.avatar_url}" alt="Avatar">
      <h2>${userData.name}</h2>
      <p>${userData.bio || 'No bio available'}</p>
      <p>Followers: ${userData.followers} | Following: ${userData.following}</p>
      <p>Public Repositories: ${userData.public_repos}</p>
      <a href="${userData.html_url}" target="_blank">View on GitHub</a>
    `;

    // Fetch recent activity
    const activityResponse = await fetch(`${userData.events_url}?per_page=5`);
    const activityData = await activityResponse.json();

    // Display recent activity
    displayRecentActivity(activityData);

    // Fetch repositories
    const reposResponse = await fetch(userData.repos_url);
    const reposData = await reposResponse.json();

    // Extract languages from repositories
    const languages = reposData.map(repo => repo.language);

    // Remove null and undefined values
    const filteredLanguages = languages.filter(language => language);

    // Count language occurrences
    const languageCounts = filteredLanguages.reduce((acc, language) => {
      acc[language] = (acc[language] || 0) + 1;
      return acc;
    }, {});

    // Display language distribution chart
    displayLanguageChart(languageCounts);

    // Display repositories
    displayRepositories(reposData);

    // Display additional statistics
    const contributionsResponse = await fetch(`https://api.github.com/users/${username}/contributions`);
    const contributionsData = await contributionsResponse.json();

    displayStatistics(contributionsData, reposData);
  } catch (error) {
    // Handle errors
    errorMessage.innerHTML = `Error: ${error.message}`;
  } finally {
    // Hide loading indicator
    loadingIndicator.style.display = 'none';
  }
}

// Function to display recent activity
function displayRecentActivity(activityData) {
  const activityList = document.getElementById('activityList');

  // Clear previous activity
  activityList.innerHTML = '';

  activityData.forEach(activity => {
    const activityItem = document.createElement('li');
    activityItem.textContent = `${activity.type} - ${new Date(activity.created_at).toLocaleString()}`;
    activityList.appendChild(activityItem);
  });
}

// Function to display the language distribution chart
function displayLanguageChart(languageCounts) {
  const chartContainer = document.getElementById('chartContainer');

  // Create a pie chart
  const ctx = document.createElement('canvas').getContext('2d');
  chartContainer.innerHTML = '';
  chartContainer.appendChild(ctx.canvas);

  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(languageCounts),
      datasets: [{
        data: Object.values(languageCounts),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
        ],
      }],
    },
  });
}

// Function to display repositories
function displayRepositories(reposData) {
  const repositoriesList = document.getElementById('repositoriesList');

  // Clear previous repositories
  repositoriesList.innerHTML = '';

  reposData.forEach(repo => {
    const repoItem = document.createElement('li');
    repoItem.innerHTML = `
      <strong>${repo.name}</strong> - 
      Star Count: ${repo.stargazers_count} | 
      Language: ${repo.language || 'Not specified'} | 
      Last Updated: ${new Date(repo.pushed_at).toLocaleDateString()}
      <button onclick="openModal(${JSON.stringify(repo)})">View Details</button>
    `;
    repoItem.dataset.name = repo.name;
    repoItem.dataset.stargazers_count = repo.stargazers_count;
    repoItem.dataset.pushed_at = repo.pushed_at;
    repoItem.dataset.language = repo.language || '';

    repositoriesList.appendChild(repoItem);
  });

  // Initial sorting
  sortRepositories();
}

// Function to sort repositories
function sortRepositories() {
  const sortCriteria = document.getElementById('sortCriteria').value;
  const repositoriesList = document.getElementById('repositoriesList');
  const repositories = Array.from(repositoriesList.children);

  repositories.sort((a, b) => {
    const aValue = a.dataset[sortCriteria];
    const bValue = b.dataset[sortCriteria];

    if (sortCriteria === 'pushed_at') {
      return new Date(bValue) - new Date(aValue);
    }

    return bValue - aValue;
  });

  repositories.forEach(repo => repositoriesList.appendChild(repo));
}

// Function to filter repositories by language
function filterRepositories() {
  const filterLanguage = document.getElementById('filterLanguage').value.toLowerCase();
  const repositoriesList = document.getElementById('repositoriesList');
  const repositories = Array.from(repositoriesList.children);

  repositories.forEach(repo => {
    const repoLanguage = repo.dataset.language.toLowerCase();
    if (repoLanguage.includes(filterLanguage)) {
      repo.style.display = 'block';
    } else {
      repo.style.display = 'none';
    }
  });
}

// Function to display statistics
function displayStatistics(contributionsData, reposData) {
  const statisticsContainer = document.getElementById('statistics');

  // Calculate the longest streak of consecutive days with contributions
  const longestStreak = calculateLongestStreak(contributionsData);
  document.getElementById('longestStreak').textContent = `Longest Streak: ${longestStreak} days`;

  // Calculate the most used programming language
  const mostUsedLanguage = calculateMostUsedLanguage(reposData);
  document.getElementById('mostUsedLanguage').textContent = `Most Used Language: ${mostUsedLanguage || 'Not specified'}`;
}

// Function to calculate the longest streak of consecutive days with contributions
function calculateLongestStreak(contributionsData) {
  let currentStreak = 0;
  let longestStreak = 0;

  contributionsData.forEach(contribution => {
    if (contribution.count > 0) {
      currentStreak++;
    } else {
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
      currentStreak = 0;
    }
  });

  // Check the last streak in case it extends to the end
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return longestStreak;
}

// Function to calculate the most used programming language
function calculateMostUsedLanguage(reposData) {
  const languageCounts = reposData.reduce((acc, repo) => {
    const language = repo.language || 'Not specified';
    acc[language] = (acc[language] || 0) + 1;
    return acc;
  }, {});

  const mostUsedLanguage = Object.keys(languageCounts).reduce((a, b) => languageCounts[a] > languageCounts[b] ? a : b, '');

  return mostUsedLanguage;
}

// Function to open the modal
function openModal(repo) {
  const modal = document.getElementById('modal');
  const repoName = document.getElementById('repoName');
  const repoDescription = document.getElementById('repoDescription');
  const repoLanguage = document.getElementById('repoLanguage');
  const repoCreationDate = document.getElementById('repoCreationDate');

  repoName.textContent = repo.name;
  repoDescription.textContent = repo.description || 'No description available';
  repoLanguage.textContent = `Language: ${repo.language || 'Not specified'}`;
  repoCreationDate.textContent = `Created on: ${new Date(repo.created_at).toLocaleDateString()}`;

  modal.style.display = 'flex';
}

// Function to close the modal
function closeModal() {
  const modal = document.getElementById('modal');
  modal.style.display = 'none';
  }
                                               
