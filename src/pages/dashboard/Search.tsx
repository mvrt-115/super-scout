import { useState } from 'react';
import './Dashboard.css';
import { db } from '../../firebase';
import {useHistory} from "react-router-dom"

const Search = () => {
    const history = useHistory()

    const [year, setYear] = useState('');
    const [regional, setRegional] = useState('');
    const [number, setNumber] = useState('');
    const [error, setError] = useState('');

    const checkPath = async () => {
        let y = year
        if (year === ""){
            y = new Date().getFullYear().toString()            
        }
        if (number === ""){
            const data = await db
            .collection('years')
            .doc(y)
            .collection('regionals')
            .doc(regional.toLowerCase()).get()
            return data.exists
        }
        else {
            const data = await db
                .collection('years')
                .doc(y)
                .collection('regionals')
                .doc(regional.toLowerCase())
                .collection('teams')
                .doc(number)
                .get();
            return data.exists;
        }
    };

    return (
        <>
            <form id='search'
                onSubmit={async (e) => {
                    e.preventDefault();
                    const y = new Date().getFullYear().toString()
                    if(regional === ""){
                        setError("Please include something to search")
                        return;
                    }
                    else{
                        setError("");
                    }
                    await checkPath().then((e) => {
                        if (!e) {
                            setError(
                            'Cannot find team "' +
                                number +
                                '" in regional "' +
                                regional +
                                '" in the year "' +
                                ((year==="") ? y : year + '"'),
                            );

                        } else {
                            history.push('dashboard/'+((year==="") ? y : year)+'/'+regional+'/'+number)
                        }
                    });
                }}
            >
                <div>
                    <div className="inputPair">
                        <input
                            type="number"
                            id="year"
                            placeholder="year"
                            value={year}
                            onChange={(e) => {
                                setYear(e.target.value);
                            }}
                        />
                    </div>
                    <div className="inputPair">
                        <input
                            type="text"
                            id="regional"
                            placeholder="regional"
                            value={regional}
                            onChange={(e) => {
                                setRegional(e.target.value.trim().toLowerCase());
                            }}
                        />
                    </div>
                    <div className="inputPair">
                        <input
                            type="number"
                            id="team"
                            placeholder="team number"
                            value={number}
                            onChange={(e) => {
                                setNumber(e.target.value);
                            }}
                        />
                    </div>
                </div>

                <button type="submit">Search</button>
            </form>
            <div id="error">{error}</div>
        </>
    );
};

export default Search;
