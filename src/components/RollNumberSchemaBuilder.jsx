import React, { useState } from 'react';
import { FaTrash, FaPlus, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';

function RollNumberSchemaBuilder({ onSave }) {
    // 1. Setup Phase
    const [sampleEmail, setSampleEmail] = useState('');
    const [usernameChars, setUsernameChars] = useState([]);
    const [selectedIndices, setSelectedIndices] = useState([]);
    
    // 2. Mapping Phase
    const [branchMappings, setBranchMappings] = useState([]); // [{ code: '05', label: 'CSE' }]
    const [codeInput, setCodeInput] = useState('');
    const [branchLabelInput, setBranchLabelInput] = useState('');

    // --- STEP 1: PARSE EMAIL ---
    const handleEmailChange = (e) => {
        const email = e.target.value.trim();
        setSampleEmail(email);
        
        // Extract username (part before @)
        if (email.includes('@')) {
            const username = email.split('@')[0];
            setUsernameChars(username.split(''));
            // Reset selection if email changes
            setSelectedIndices([]);
        } else {
            setUsernameChars([]);
        }
    };

    // --- STEP 2: HANDLE BOX SELECTION ---
    const toggleIndex = (index) => {
        if (selectedIndices.includes(index)) {
            setSelectedIndices(selectedIndices.filter(i => i !== index));
        } else {
            // Sort indices to keep them in order (e.g., [6, 7])
            const newIndices = [...selectedIndices, index].sort((a, b) => a - b);
            
            // Validation: Ensure selection is contiguous (connected)
            // We don't want index 2 and index 8 without the middle ones.
            const isContiguous = newIndices.every((val, i, arr) => {
                return i === 0 || val === arr[i - 1] + 1;
            });

            if (isContiguous) {
                setSelectedIndices(newIndices);
            } else {
                alert("Please select contiguous (connected) characters for the Branch Code.");
            }
        }
    };

    // --- STEP 3: MANAGE BRANCH MAPPINGS ---
    const addMapping = () => {
        if (!codeInput || !branchLabelInput) return;
        
        // Check exact length match
        if (codeInput.length !== selectedIndices.length) {
            alert(`Code must be exactly ${selectedIndices.length} characters long based on your selection.`);
            return;
        }

        // Check duplicates
        if (branchMappings.some(m => m.code === codeInput)) {
            alert("This code is already mapped.");
            return;
        }

        setBranchMappings([...branchMappings, { code: codeInput.toUpperCase(), label: branchLabelInput.toUpperCase() }]);
        setCodeInput('');
        setBranchLabelInput('');
    };

    const removeMapping = (code) => {
        setBranchMappings(branchMappings.filter(m => m.code !== code));
    };

    // --- FINAL STEP: GENERATE CONFIG ---
    const handleSaveConfig = () => {
        if (selectedIndices.length === 0 || branchMappings.length === 0) {
            alert("Please define the pattern and add at least one branch.");
            return;
        }

        // Create the clean config object
        const config = {
            indices: selectedIndices, // e.g., [6, 7]
            mapping: branchMappings.reduce((acc, curr) => {
                acc[curr.code] = curr.label;
                return acc;
            }, {}) // Converts array to { "05": "CSE", "04": "ECE" }
        };

        onSave(config); // Send to parent component
    };

    return (
        <div className="bg-slate-700 p-6 rounded-lg border border-slate-600">
            <h3 className="text-lg font-bold text-white mb-4">📩 Email-to-Branch Configuration</h3>
            
            {/* 1. INPUT SAMPLE */}
            <div className="mb-6">
                <label className="block text-sm text-gray-300 mb-2">Enter a Sample Student Email</label>
                <input 
                    type="email" 
                    value={sampleEmail}
                    onChange={handleEmailChange}
                    placeholder="e.g. 21mh1a0501@college.edu"
                    className="w-full px-4 py-2 bg-slate-800 text-white rounded border border-slate-600 focus:border-sky-500 outline-none"
                />
                <p className="text-xs text-gray-400 mt-2">
                    <FaInfoCircle className="inline mr-1"/>
                    We will analyze the text <strong>before</strong> the '@' symbol.
                </p>
            </div>

            {/* 2. VISUAL SELECTOR */}
            {usernameChars.length > 0 && (
                <div className="mb-8">
                    <label className="block text-sm text-sky-300 font-bold mb-3">
                        Click the characters that represent the BRANCH CODE:
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {usernameChars.map((char, index) => {
                            const isSelected = selectedIndices.includes(index);
                            return (
                                <div 
                                    key={index}
                                    onClick={() => toggleIndex(index)}
                                    className={`
                                        w-10 h-12 flex flex-col items-center justify-center rounded cursor-pointer transition-all border-2
                                        ${isSelected 
                                            ? 'bg-sky-600 border-sky-400 text-white transform -translate-y-1 shadow-lg shadow-sky-900/50' 
                                            : 'bg-slate-800 border-slate-600 text-gray-400 hover:border-gray-400'
                                        }
                                    `}
                                >
                                    <span className="text-lg font-mono font-bold">{char}</span>
                                    <span className="text-[9px] text-gray-500 mt-[-2px]">{index}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 3. MAPPING INPUT (Only shows after selection) */}
            {selectedIndices.length > 0 && (
                <div className="bg-slate-800 p-4 rounded border border-slate-600 animate-fade-in-down">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-white">Define Branch Codes</h4>
                        <span className="text-xs bg-sky-900 text-sky-300 px-2 py-1 rounded">
                            Length: {selectedIndices.length} digits
                        </span>
                    </div>

                    {/* Add Form */}
                    <div className="flex gap-2 mb-4">
                        <input 
                            value={codeInput}
                            onChange={(e) => setCodeInput(e.target.value)}
                            placeholder={`Code (e.g. ${usernameChars.filter((_, i) => selectedIndices.includes(i)).join('')})`}
                            maxLength={selectedIndices.length}
                            className="w-1/3 px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 text-center uppercase font-mono"
                        />
                        <input 
                            value={branchLabelInput}
                            onChange={(e) => setBranchLabelInput(e.target.value)}
                            placeholder="Branch Name (e.g. CSE)"
                            className="flex-1 px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 uppercase"
                        />
                        <button 
                            onClick={addMapping}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 rounded font-bold"
                        >
                            <FaPlus />
                        </button>
                    </div>

                    {/* Mapped List */}
                    {branchMappings.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {branchMappings.map((m) => (
                                <div key={m.code} className="flex justify-between items-center bg-slate-700 px-3 py-2 rounded border border-slate-600">
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-sky-400 font-bold">{m.code}</span>
                                        <span className="text-gray-500">→</span>
                                        <span className="text-white font-bold">{m.label}</span>
                                    </div>
                                    <button onClick={() => removeMapping(m.code)} className="text-red-400 hover:text-red-300">
                                        <FaTrash size={12}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 text-xs py-2">No branches added yet.</p>
                    )}
                </div>
            )}
            
            {/* 4. SAVE BUTTON */}
            <div className="mt-6 pt-4 border-t border-slate-600 flex justify-end">
                <button 
                    onClick={handleSaveConfig}
                    className="flex items-center bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 rounded font-bold transition-colors"
                >
                    <FaCheckCircle className="mr-2"/> Save Pattern Logic
                </button>
            </div>
        </div>
    );
}

export default RollNumberSchemaBuilder;