export const calcAutonPoints = (matchData: any, year: number | string) => {
    if (year == '2019') {
        return matchData.autonBottom * 2 +
            matchData.autonUpper * 4 +
            matchData.autonInner * 6 +
            matchData.crossedInitLine
            ? 5
            : 0;
    } else if (year == '2022') {
        let autonPoints: number = 0;
        autonPoints +=
            2 * matchData['Auton Bottom'] + 4 * matchData['Auton Upper'];
        if (matchData['Left Tarmac'] === undefined)
            autonPoints += 2 * +matchData['Leave Tarmac'];
        else autonPoints += 2 * +matchData['Left Tarmac'];
        return autonPoints;
    } else if (year == '2023') {
        let autonPoints: number =
            6 *
                (matchData['Auton Upper Cone'] +
                    matchData['Auton Upper Cube']) +
            4 * (matchData['Auton Mid Cone'] + matchData['Auton Mid Cube']) +
            3 * (matchData['Auton Lower Cube'] + matchData['Auton Lower Cone']);
        if (matchData['Auton Engaged']) {
            autonPoints += 12;
        } else if (matchData['Auton Docked']) {
            autonPoints += 8;
        }
        if (matchData['Mobility']) {
            autonPoints += 3;
        }
        return autonPoints;
    }
    else if(year == '2024'){
        let autonPoints: number = 5 * matchData['Auton Speaker Scored'] + 2 * matchData['Auton Amp Scored'];
        if(matchData['Mobility']){
            autonPoints+=2;
        }
        return autonPoints;
    }
    return -1;
};

export const calcTeleopPoints = (matchData: any, year: number | string) => {
    if (year == '2019') {
        return (
            matchData.teleopBottom +
            matchData.teleopUpper * 2 +
            matchData.teleopInner * 4
        );
    } else if (year == '2022') {
        return matchData['Teleop Bottom'] + matchData['Teleop Upper'] * 2;
    } else if (year == '2023') {
        return (
            5 *
                (matchData['Teleop Upper Cone'] +
                    matchData['Teleop Upper Cube']) +
            3 * (matchData['Teleop Mid Cone'] + matchData['Teleop Mid Cube']) +
            2 *
                (matchData['Teleop Lower Cone'] +
                    matchData['Teleop Lower Cube'])
        );
    }
    else if(year == '2024'){
        return (
            2 * matchData['Teleop Speaker Scored'] + matchData['Teleop Amp Scored']//DOES NOT ACCOUNT FOR AMP
        )
    }
    return -1;
};

export const calcEndgamePoints = (matchData: any, year: number | string) => {
    if (year == '2019') {
        let endgamePoints = 5;
        if (!matchData.hangFail) endgamePoints += 20;
        if (!matchData.levelFail) endgamePoints += 15;
        return endgamePoints;
    } else if (year == '2022') {
        let climbScore: number = 0;
        switch (matchData['Climb rung']) {
            case 'Low':
                climbScore = 4;
                break;
            case 'Mid':
                climbScore = 6;
                break;
            case 'High':
                climbScore = 10;
                break;
            case 'Traversal':
                climbScore = 15;
                break;
            default:
                climbScore = 0;
        }
        return climbScore;
    } else if (year == '2023') {
        let endgamePoints: number = 0;
        if (matchData['Endgame Engaged']) {
            endgamePoints += 10;
        } else if (matchData['Endgame Docked']) {
            endgamePoints += 6;
        }
        if (matchData['Park']) {
            endgamePoints += 2;
        }
        return endgamePoints;
    } else if(year == '2024'){
        let endgamePoints: number = 0;
        if(matchData['Climb Level'] == 'Solo'){
            endgamePoints+=3;
        }
        if(matchData['Climb Level'] == 'Harmony'){
            endgamePoints+=4;
        }
        if(matchData['Park']){
            endgamePoints+=1;
        }
        if(matchData['Trap']){
            endgamePoints+=5;
        }
        return endgamePoints;
    }
    return -1;
};
