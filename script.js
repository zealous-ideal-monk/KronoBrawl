document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const generateBtn = document.getElementById('generate-btn');
    const exportBtn = document.getElementById('export-btn');
    const printBtn = document.getElementById('print-btn');
    const scheduleOutput = document.getElementById('schedule-output');
    const tournamentType = document.getElementById('tournament-type');
    const tournamentName = document.getElementById('tournament-name');
    const tournamentTitle = document.getElementById('tournament-title');
    const tournamentTypeBadge = document.getElementById('tournament-type-badge');
    const teamsList = document.getElementById('teams-list');
    const newTeamInput = document.getElementById('new-team');
    const addTeamBtn = document.getElementById('add-team-btn');
    
    let teams = [];
    
    // Load initial teams from JSON
    fetch('teams.json')
        .then(response => response.json())
        .then(initialTeams => {
            teams = initialTeams;
            displayTeams();
        })
        .catch(error => console.error('Error loading teams:', error));

    // Add team functionality
    addTeamBtn.addEventListener('click', addTeam);
    newTeamInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTeam();
        }
    });

    function addTeam() {
        const teamName = newTeamInput.value.trim();
        if (teamName) {
            const newTeam = {
                id: teams.length + 1,
                name: teamName
            };
            teams.push(newTeam);
            displayTeams();
            newTeamInput.value = '';
            newTeamInput.focus();
        }
    }

    function removeTeam(teamId) {
        teams = teams.filter(team => team.id !== teamId);
        displayTeams();
    }

    function displayTeams() {
        teamsList.innerHTML = '';
        teams.forEach(team => {
            const teamElement = document.createElement('div');
            teamElement.className = 'team-item';
            teamElement.innerHTML = `
                <div class="team-name">
                    <i class="fas fa-user-alt"></i>
                    <span>${team.name}</span>
                </div>
                <div class="team-actions">
                    <button class="delete-btn" onclick="removeTeam(${team.id})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            teamsList.appendChild(teamElement);
        });
    }

    // Make removeTeam function available globally
    window.removeTeam = removeTeam;
    
    generateBtn.addEventListener('click', function() {
        const name = tournamentName.value || "Unnamed Tournament";
        const type = tournamentType.value;
        
        // Update tournament info display
        tournamentTitle.textContent = name;
        tournamentTypeBadge.textContent = getTournamentTypeName(type);
        
        let schedule;
        if (type === 'round-robin') {
            schedule = generateRoundRobin(teams);
        } else if (type === 'single-elimination') {
            schedule = generateSingleElimination(teams);
        } else {
            schedule = generateDoubleElimination(teams);
        }
        
        displaySchedule(schedule);
        
        // Enable export and print buttons
        exportBtn.disabled = false;
        printBtn.disabled = false;
    });

    // Export button functionality
    exportBtn.addEventListener('click', function() {
        alert('Schedule exported! (This would export the schedule in a real app)');
    });

    // Print button functionality
    printBtn.addEventListener('click', function() {
        window.print();
    });

    // Helper function to get tournament type name
    function getTournamentTypeName(type) {
        const types = {
            'round-robin': 'Round Robin',
            'single-elimination': 'Single Elimination',
            'double-elimination': 'Double Elimination'
        };
        return types[type] || type;
    }

    // Round Robin algorithm
    function generateRoundRobin(teams) {
        const schedule = [];
        const numTeams = teams.length;
        
        if (numTeams % 2 !== 0) {
            teams.push({name: "BYE", id: null});
        }
        
        const numRounds = teams.length - 1;
        const half = teams.length / 2;
        
        for (let round = 0; round < numRounds; round++) {
            const roundMatches = [];
            
            for (let i = 0; i < half; i++) {
                const home = teams[i];
                const away = teams[teams.length - 1 - i];
                
                if (home.name !== "BYE" && away.name !== "BYE") {
                    roundMatches.push({
                        round: round + 1,
                        home: home.name,
                        away: away.name
                    });
                }
            }
            
            schedule.push(...roundMatches);
            teams.splice(1, 0, teams.pop());
        }
        
        return schedule;
    }

    // Single Elimination algorithm
    function generateSingleElimination(teams) {
        const schedule = [];
        let currentRound = [...teams];
        let roundNum = 1;
        
        while (currentRound.length > 1) {
            const nextRound = [];
            
            for (let i = 0; i < currentRound.length; i += 2) {
                if (i + 1 < currentRound.length) {
                    schedule.push({
                        round: roundNum,
                        home: currentRound[i].name,
                        away: currentRound[i+1].name
                    });
                    nextRound.push(currentRound[i]); // Just pick one for demo
                } else {
                    nextRound.push(currentRound[i]); // Odd team gets a bye
                }
            }
            
            currentRound = nextRound;
            roundNum++;
        }
        
        return schedule;
    }

    // Double Elimination algorithm (simplified)
    function generateDoubleElimination(teams) {
        // For demo purposes - a real implementation would be more complex
        const winnersBracket = generateSingleElimination(teams);
        const losersBracket = generateSingleElimination(teams);
        
        // Combine both brackets for display
        return [
            ...winnersBracket.map(match => ({ ...match, bracket: "Winners" })),
            ...losersBracket.map(match => ({ ...match, bracket: "Losers" }))
        ];
    }

    // Display the schedule
    function displaySchedule(schedule) {
        if (schedule.length === 0) {
            scheduleOutput.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>No matches could be generated with the current settings</p>
                </div>
            `;
            return;
        }
        
        // Group matches by round
        const matchesByRound = schedule.reduce((acc, match) => {
            if (!acc[match.round]) {
                acc[match.round] = [];
            }
            acc[match.round].push(match);
            return acc;
        }, {});
        
        scheduleOutput.innerHTML = '';
        
        // Display matches grouped by round
        Object.entries(matchesByRound).forEach(([round, matches]) => {
            const roundHeader = document.createElement('div');
            roundHeader.className = 'round-header';
            roundHeader.innerHTML = `<h3>Round ${round}</h3>`;
            scheduleOutput.appendChild(roundHeader);
            
            matches.forEach(match => {
                const matchElement = document.createElement('div');
                matchElement.className = 'match';
                
                const bracketInfo = match.bracket ? `<span class="match-bracket">${match.bracket}</span>` : '';
                
                matchElement.innerHTML = `
                    <div class="match-teams">
                        <span class="match-team">${match.home}</span>
                        <span class="match-vs">vs</span>
                        <span class="match-team">${match.away}</span>
                    </div>
                    <div class="match-actions">
                        <button class="match-btn"><i class="far fa-edit"></i></button>
                        <button class="match-btn"><i class="far fa-trash-alt"></i></button>
                    </div>
                `;
                scheduleOutput.appendChild(matchElement);
            });
        });
    }
});