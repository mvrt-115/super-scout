import {
    Box,
    Button,
    Flex,
    Grid,
    Heading,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Spinner,
    Stack,
    Tooltip,
} from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import { db } from '../../firebase';
import { ReactComponent as Empty } from '../../assets/Empty.svg';
import { BiSortDown, BiSortUp } from 'react-icons/bi';

interface RouteParams {
    year: string;
    regional: string;
}

interface Team {
    name: string;
    opr: number;
    dpr: number;
    ccwm: number;
    rank: number;
}

const Teams: FC<RouteComponentProps<RouteParams>> = ({ match }) => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [startDate, setStartDate] = useState<number>(Date.now());
    const year = match.params.year;
    const regional = match.params.regional;
    const [loading, setLoading] = useState<boolean>(false);
    const [sort, setSort] = useState<string>('Ranking');
    const [noData, setNoData] = useState<boolean>(false);
    const [aiLoading, setAiLoading] = useState<boolean>(false);
    const [aiResponse, setAiResponse] = useState<string>('');

    useEffect(() => {
        const eventKey = `${year}${regional}`;
        const tbaHeaders = {
            headers: {
                'X-TBA-Auth-Key': process.env.REACT_APP_TBA_KEY || '',
            },
        };

        const getTeamsInfo = async () => {
            let teams: Team[] = [];
            setLoading(true);
            setNoData(false);
            try {
                const [rankingsRes, oprsRes] = await Promise.all([
                    fetch(
                        `https://www.thebluealliance.com/api/v3/event/${eventKey}/rankings`,
                        tbaHeaders,
                    ),
                    fetch(
                        `https://www.thebluealliance.com/api/v3/event/${eventKey}/oprs`,
                        tbaHeaders,
                    ),
                ]);

                const [oprsJson, rankingsJson]: [any, any] = await Promise.all([
                    oprsRes.json(),
                    rankingsRes.json(),
                ]);

                const hasRankings =
                    rankingsRes.ok &&
                    rankingsJson?.rankings?.length > 0 &&
                    oprsRes.ok &&
                    oprsJson?.oprs;

                if (hasRankings) {
                    for (let i = 0; i < rankingsJson.rankings.length; i++) {
                        const key: string =
                            rankingsJson.rankings[i]['team_key'];
                        teams.push({
                            name: key.substring(3),
                            opr: (oprsJson.oprs[key] as number) ?? 0,
                            dpr: (oprsJson.dprs[key] as number) ?? 0,
                            ccwm: (oprsJson.ccwms[key] as number) ?? 0,
                            rank: i + 1,
                        });
                    }
                    setTeams(teams);
                    return;
                }

                // No rankings yet (e.g. upcoming event) – try event teams list
                const teamsRes = await fetch(
                    `https://www.thebluealliance.com/api/v3/event/${eventKey}/teams`,
                    tbaHeaders,
                );
                if (teamsRes.ok) {
                    const teamsJson = await teamsRes.json();
                    if (Array.isArray(teamsJson) && teamsJson.length > 0) {
                        teams = teamsJson.map((t: any, i: number) => ({
                            name: String(t.team_number),
                            opr: 0,
                            dpr: 0,
                            ccwm: 0,
                            rank: i + 1,
                        }));
                        setTeams(teams);
                        return;
                    }
                }

                setNoData(true);
            } catch {
                setNoData(true);
            } finally {
                setLoading(false);
            }
        };
        getTeamsInfo();
    }, [year, regional]);
    // useEffect(() => {
    //     const getTeamsInfo = async () => {
    //         let teams: Team[] = [
    //             { name: '8', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '115', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '192', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '359', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '399', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '687', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '696', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '1148', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '1566', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '1569', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '1891', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '2122', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '2130', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '2594', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '2813', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '3006', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '3045', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '3216', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '3243', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '3245', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '3288', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '3309', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '3669', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '3859', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '4175', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '4598', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '4944', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '5461', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '5871', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '5933', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '6358', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '6364', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '6390', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '6487', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '7634', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '7895', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '8338', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '8546', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '8550', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '8551', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '8756', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '8839', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '8885', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '9044', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '9243', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '9314', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '9449', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '9649', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '9726', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '9737', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '10395', opr: 0, dpr: 0, ccwm: 0, rank: 0 },
    //             { name: '10448', opr: 0, dpr: 0, ccwm: 0, rank: 0 }
    //           ];
              
    //         // const [rankingsRes, oprsRes] = await Promise.all([
    //         //     fetch(
    //         //         `https://www.thebluealliance.com/api/v3/event/${year}${regional}/rankings`,
    //         //         {
    //         //             headers: {
    //         //                 'X-TBA-Auth-Key':
    //         //                     process.env.REACT_APP_TBA_KEY || '',
    //         //             },
    //         //         },
    //         //     ),
    //         //     fetch(
    //         //         `https://www.thebluealliance.com/api/v3/event/${year}${regional}/oprs`,
    //         //         {
    //         //             headers: {
    //         //                 'X-TBA-Auth-Key':
    //         //                     process.env.REACT_APP_TBA_KEY || '',
    //         //             },
    //         //         },
    //         //     ),
    //         // ]);

    //         // const [oprsJson, rankingsJson]: [any, any] = await Promise.all([
    //         //     oprsRes.json(),
    //         //     rankingsRes.json(),
    //         // ]);

    //         // // console.log(oprsJson, rankingsJson);

    //         // if (!oprsJson || !rankingsJson) {
    //         //     setLoading(false);
    //         //     setNoData(true);
    //         //     return;
    //         // }

    //         // for (let i = 0; i < rankingsJson.rankings.length; i++) {
    //         //     const key: string = rankingsJson.rankings[i]['team_key'];
    //         //     teams.push({
    //         //         name: key.substring(3),
    //         //         opr: oprsJson.oprs[key] as number,
    //         //         dpr: oprsJson.dprs[key] as number,
    //         //         ccwm: oprsJson.ccwms[key] as number,
    //         //         rank: i + 1,
    //         //     });
    //         // }
    //         setLoading(true);
    //         const regionalKey = year + regional;
    //         const rankingsUrl = `https://www.thebluealliance.com/api/v3/event/${regionalKey}/rankings`;
    //         const oprsUrl = `https://www.thebluealliance.com/api/v3/event/${regionalKey}/oprs`;
            
    //         console.log("Rankings URL:", rankingsUrl);
    //         console.log("OPRs URL:", oprsUrl);

    //         setLoading(false);
    //         if ((teams.length) > 0) setTeams(teams);
    //         console.log("teams are: ", teams)
    //     };
    //     getTeamsInfo();
    // }, [year, regional]);

    const sortList = (type: string) => {
        setSort(type);
        let newTeams = teams;
        newTeams.sort((a, b) => {
            if (type === 'Ranking') return a.rank - b.rank;
            const stat = type.toLowerCase();
            if (stat === 'opr' || stat === 'dpr' || stat === 'ccwm')
                return b[stat] - a[stat];
            return 0;
        });
    };

    const fetchCompetitionData = async () => {
        const teamList = db
        .collection('years')
        .doc(year)
        .collection('regionals')
        .doc(regional)
        .collection('teams');
        const coll = await teamList.get();
        const obj: any = { teams: [] };
    
        await Promise.all(
        coll.docs.map(async (doc) => {
            const temp: any = doc.data();
            temp.matchList = [];
            const matches = await teamList.doc(doc.id).collection('matches').get();
            matches.docs.forEach(m => temp.matchList.push(m.data()));
            const pit = await teamList
            .doc(doc.id)
            .collection('pitScoutData')
            .doc('pitScoutAnswers')
            .get();
            if (pit.exists) temp.pitScoutData = pit.data();
            obj.teams.push(temp);
        })
        );
    
        return obj;
    };

    const AI_PROMPT = `You are a helpful robotics competition data analyst. 
        Given the JSON data for all teams, please use the metrics to tell me 
        and rank the best 8 teams considering both by how well they have done 
        so far and their potential for continuing to do well. For each, also 
        give some brief reasoning of why you picked that team. Here is some 
        context about the metrics. For the metrics that have the word “missed” 
        in it, a lower value is better. For the metrics that have the word “scored” 
        in it, a higher value is better. For the metrics that have the word “Can” 
        in them, it is better if it is true. A higher total coral/algae scored, 
        cycles, and points is good. By the way, the file has data for multiples 
        matches of multiple teams. Different matches could have different results 
        but you have to use all the matches of a team to get a good general idea 
        of how good the team is. Here are all the metrics separated by commas 
        also listed here for your convenience but the actual data is in the 
        attached file: (A) Algae Net Missed, (A) Algae Net Scored, (A) Algae 
        Processor Missed, (A) Algae Processor Scored, (A) Algae Removed Failed, 
        (A) Algae Removed Success, (A) Coral L1 Missed, (A) Coral L1 Scored, 
        (A) Coral L2 Missed, (A) Coral L2 Scored, (A) Coral L3 Missed, 
        (A) Coral L3 Scored, (A) Coral L4 Missed, (A) Coral L4 Scored, 
        (T) Algae Net Missed, (T) Algae Net Scored, (T) Algae Processor Missed, 
        (T) Algae Processor Scored, (T) Algae Removed Failed, (T) Algae Removed 
        Success, (T) Coral L1 Missed, (T) Coral L1 Scored, (T) Coral L2 Missed, 
        (T) Coral L2 Scored, (T) Coral L3 Missed, (T) Coral L3 Scored, (T) Coral L4 Missed, 
        (T) Coral L4 Scored, Can Deep Climb, Can Score Back, Can Score Back Left, 
        Can Score Back Right, Can Score Front, Can Score Front Left, 
        Can Score Front Right, Can Score L1, Can Score L2, Can Score L3, 
        Can Score L4, Can Score Net, Can Score Processor, Can Shallow Climb, 
        Mobility, Received Coral RP, Remove algae, Team Number, Total Coral/Algae Scored, 
        Total Cycles, autonPoints, endgamePoints, matchList, matchNum, matches, 
        teamNum, teleopPoints. It is important that you do not just use a few metrics, 
        but that you consider all of them that were listed and consider what I said earlier 
        about which ones mean that a team is good and which ones mean that a team is not so good. 
        Also, the Statbotics (https://www.statbotics.io/teams) website has good data about the
        teams if want to consider it. The data I have you is more important, but I am letting you 
        know in case it gives you added information. This is important: don't just use a little bit 
        of data, use ALL of it (as many metrics as possible) because it will give you more accurate 
        generalizations. Make sure to list out the 8 teams normally (not as a chart or table) 
        as well as some reasoning. Make the first line of your output says that you are an analyst. 
        Also tell me if there was a .json file that you recieved from this query.`;
    //const AI_PROMPT = 'Did you recieve this message?';

    const handleAIMode = async () => {
        setAiLoading(true);
        setAiResponse('');
    
        try {
            const dataObj = await fetchCompetitionData();
            const teams = dataObj.teams;
            const chunkSize = Math.ceil(teams.length / 3);
    
            const chunks = [
                teams.slice(0, chunkSize),
                teams.slice(chunkSize, chunkSize * 2),
                teams.slice(chunkSize * 2),
            ];
    
            const analyzeChunk = async (chunk: any[], label: string): Promise<string> => {
                const jsonStr = JSON.stringify({ teams: chunk }, null, 2);
                console.log(`🧠 Chunk #${label} - JSON character count: ${jsonStr.length}`);
                console.log(`🧠 Chunk #${label} - Estimated token count: ${jsonStr.length / 4}`);
    
                const payload = {
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful FRC robotics data analyst.',
                        },
                        {
                            role: 'user',
                            content: `${AI_PROMPT}\n\nHere is part #${label} of the competition data:\n\n\`\`\`json\n${jsonStr}\n\`\`\`\n\nStart your response with "Analysis for part #${label}:"`,
                        },
                    ],
                    max_tokens: 4096,
                };
    
                const res = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
                    },
                    body: JSON.stringify(payload),
                });
    
                const json = await res.json();
                return json.choices?.[0]?.message?.content?.trim() || `No analysis needed/returned for part #${label}.`;
            };
    
            const responses: string[] = [];
    
            for (let i = 0; i < 3; i++) {
                const response = await analyzeChunk(chunks[i], (i + 1).toString());
                responses.push(response);
            }
    
            setAiResponse(responses.join('\n\n---\n\n'));
        } catch (err) {
            console.error(err);
            setAiResponse('Error fetching AI response.');
        } finally {
            setAiLoading(false);
        }
    };

    const downloadData = async () => {
        const teamList = db
            .collection('years')
            .doc(year)
            .collection('regionals')
            .doc(regional)
            .collection('teams');
        teamList.get().then(async (coll) => {
            let obj: any = { teams: [] };
            await Promise.all(
                coll.docs.map(async (doc) => {
                    let temp = doc.data();
                    temp.matchList = [];
                    await teamList
                        .doc(doc.id)
                        .collection('matches')
                        .get()
                        .then((matches) => {
                            matches.docs.forEach((match) => {
                                temp.matchList.push(match.data());
                            });
                        });
                    await teamList
                        .doc(doc.id)
                        .collection('pitScoutData')
                        .doc('pitScoutAnswers')
                        .get()
                        .then((pitScout) => {
                            if (pitScout.exists) {
                                temp.pitScoutData = pitScout.data();
                            }
                        });
                    obj.teams.push(temp);
                }),
            );
            // console.log(obj);
            const fileName = `${year}${regional}Data`;
            const json = JSON.stringify(obj);
            const blob = new Blob([json], { type: 'application/json' });
            const href = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = href;
            link.download = fileName + '.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };

    if (noData)
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                }}
            >
                <Empty width={'90%'} height={'90%'} />
                <Heading
                    as="h3"
                    size="md"
                    textAlign={'center'}
                    marginTop={'2%'}
                >
                    The {regional.toUpperCase()} event has not started yet
                </Heading>
            </div>
        );

    if (loading)
        return (
            <div
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Spinner />
            </div>
        );
    return (
        <Stack width="100%">
            <Box>
                <Button
                    as={Link}
                    to={`/dashboard/${year}/${regional}/regional-data/`}
                    colorScheme="mv-purple"
                    size="lg"
                    width={'100%'}
                >
                    View Regional Data
                </Button>
                <Button
                    onClick={downloadData}
                    colorScheme="mv-purple"
                    size="lg"
                    width={'100%'}
                    marginTop="2"
                >
                    Download Data
                </Button>
                <Button
                    onClick={handleAIMode}
                    colorScheme="mv-purple"
                    size="lg"
                    width={'100%'}
                    marginTop="2"
                >
                    AI Analysis
                </Button>
            </Box>
            {aiLoading && (
                <Flex justify="center" my={4}>
                    <Spinner />
                </Flex>
                )}
                {!!aiResponse && (
                <Box
                    whiteSpace="pre-wrap"
                    p={4}
                    mt={4}
                    bg="gray.50"
                    borderRadius="md"
                >
                    {aiResponse}
                </Box>
                )}
            <Flex width="100%" justify={'end'}>
                <Menu>
                    <Tooltip label="Sort By">
                        <MenuButton
                            aria-label={'sort'}
                            bg="none"
                            _hover={{ backgroundColor: 'none' }}
                        >
                            <Flex
                                justifyContent={'center'}
                                alignItems={'center'}
                            >
                                {sort}{' '}
                                {sort === 'Ranking' ? (
                                    <BiSortUp />
                                ) : (
                                    <BiSortDown />
                                )}
                            </Flex>
                        </MenuButton>
                    </Tooltip>
                    <MenuList>
                        <MenuItem onClick={() => sortList('Ranking')}>
                            Ranking
                        </MenuItem>
                        <MenuItem onClick={() => sortList('OPR')}>OPR</MenuItem>
                        <MenuItem onClick={() => sortList('DPR')}>DPR</MenuItem>
                        <MenuItem onClick={() => sortList('CCWM')}>
                            CCWM
                        </MenuItem>
                    </MenuList>
                </Menu>
            </Flex>
            <Grid
                gap={1}
                templateColumns={'repeat(auto-fit, minmax(200px, 1fr))'}
                width={'100%'}
            >
                {teams.map((team, index: number) => (
                    <li className="link" key={team.name}>
                        <Tooltip
                            label={`Rank: ${team.rank}
                            \nOPR: ${Math.round(team.opr * 10) / 10}
                                \nDPR: ${Math.round(team.dpr * 10) / 10}
                                \nCCWM: ${Math.round(team.ccwm * 10) / 10}
                                `}
                        >
                            <Link
                                to={`/dashboard/${year}/${regional}/${team.name}`}
                                style={{ textAlign: 'center' }}
                            >
                                {team.name}
                            </Link>
                        </Tooltip>
                    </li>
                ))}
            </Grid>
        </Stack>
    );
};

export default Teams;
