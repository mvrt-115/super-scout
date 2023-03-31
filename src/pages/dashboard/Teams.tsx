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

    useEffect(() => {
        const getTeamsInfo = async () => {
            let teams: Team[] = [];
            setLoading(true);
            const [rankingsRes, oprsRes] = await Promise.all([
                fetch(
                    `https://www.thebluealliance.com/api/v3/event/${year}${regional}/rankings`,
                    {
                        headers: {
                            'X-TBA-Auth-Key':
                                process.env.REACT_APP_TBA_KEY || '',
                        },
                    },
                ),
                fetch(
                    `https://www.thebluealliance.com/api/v3/event/${year}${regional}/oprs`,
                    {
                        headers: {
                            'X-TBA-Auth-Key':
                                process.env.REACT_APP_TBA_KEY || '',
                        },
                    },
                ),
            ]);

            const [oprsJson, rankingsJson]: [any, any] = await Promise.all([
                oprsRes.json(),
                rankingsRes.json(),
            ]);

            // console.log(oprsJson, rankingsJson);

            if (!oprsJson || !rankingsJson) {
                setLoading(false);
                setNoData(true);
                return;
            }

            for (let i = 0; i < rankingsJson.rankings.length; i++) {
                const key: string = rankingsJson.rankings[i]['team_key'];
                teams.push({
                    name: key.substring(3),
                    opr: oprsJson.oprs[key] as number,
                    dpr: oprsJson.dprs[key] as number,
                    ccwm: oprsJson.ccwms[key] as number,
                    rank: i + 1,
                });
            }
            setLoading(false);
            setTeams(teams);
        };
        getTeamsInfo();
    }, [year, regional]);

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
            </Box>
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
