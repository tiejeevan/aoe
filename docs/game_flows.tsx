
// This file is a non-rendered TSX file for documentation purposes.
// It outlines the core features, game flows, and user/system actions
// within the Gemini Empires application. This helps in understanding the
// application's architecture and potential areas for AI integration.

import React from 'react';

// =================================================================
// 1. CORE GAME FEATURES & CHECKLIST
// =================================================================
const CoreFeaturesChecklist = () => (
  <div id="feature-documentation">
    
    <h2>Game Lifecycle</h2>
    <ul>
        <li>✅ Start a new named game (saga)</li>
        <li>✅ Resume a previously saved game</li>
        <li>✅ Delete a saved game</li>
        <li>✅ Game state is saved automatically</li>
        <li>✅ Exit a game back to the main menu</li>
    </ul>

    <h2>Resource Management</h2>
    <ul>
        <li>✅ Villagers can be assigned to gather resources (Food, Wood, Gold, Stone)</li>
        <li>✅ Resources are added to player's stockpile over time</li>
        <li>✅ Villagers can be recalled from gathering tasks</li>
        <li>✅ Resource nodes are depleted over time and disappear when empty</li>
        <li>✅ UI shows current resource totals and change deltas</li>
        <li>❌ Resource drop-off points (e.g., Lumber Camp) to optimize gathering</li>
    </ul>
    
    <h2>Building & Construction</h2>
    <ul>
        <li>✅ Villagers can be commanded to build structures</li>
        <li>✅ Resources are consumed when construction starts</li>
        <li>✅ Construction happens over a set duration, shown with a progress bar</li>
        <li>✅ Multiple villagers can be assigned to a construction site to speed it up</li>
        <li>✅ Player can demolish existing buildings to recoup some resources</li>
        <li>✅ Player can rename individual buildings</li>
        <li>✅ Buildings have unique costs, HP, and build times</li>
        <li>✅ Some buildings provide population capacity (Houses, Town Center)</li>
        <li>✅ Some buildings are unique (only one can be built)</li>
        <li>❌ Repairing damaged buildings</li>
        <li>❌ Buildings taking damage over time (decay)</li>
    </ul>

    <h2>Unit Training & Population</h2>
    <ul>
        <li>✅ Town Center can train Villagers</li>
        <li>✅ Military buildings (Barracks, etc.) can train specific military units</li>
        <li>✅ Unit training consumes resources and takes time</li>
        <li>✅ Population is tracked (current vs. capacity)</li>
        <li>✅ Player can view and manage lists of their villagers and military units</li>
        <li>✅ Player can dismiss (delete) individual units</li>
        <li>✅ Player can rename individual units</li>
        <li>❌ Setting rally points for newly trained units</li>
        <li>❌ Garrisoning units inside buildings for protection</li>
    </ul>

    <h2>Combat</h2>
    <ul>
        <li>❌ Units can be commanded to attack enemy units</li>
        <li>❌ Units can be commanded to attack enemy buildings</li>
        <li>❌ Units automatically retaliate when attacked</li>
        <li>❌ Units deal damage and have health points</li>
        <li>❌ Units die and are removed from the game when HP reaches zero</li>
        <li>❌ Defensive structures (Watch Tower) automatically attack nearby enemies</li>
        <li>❌ Different units having different attack stats (damage, range, speed)</li>
    </ul>

    <h2>Technology & Progression</h2>
    <ul>
        <li>✅ Player can advance from one Age to the next via the Town Center</li>
        <li>✅ Advancing Ages costs significant resources and time</li>
        <li>✅ Advancing an Age unlocks new buildings and technologies</li>
        <li>✅ Player can research specific technologies from buildings like the Blacksmith</li>
        <li>✅ Research costs resources and time</li>
        <li>✅ Completed research is tracked</li>
        <li>❌ Research providing tangible bonuses (e.g., +1 attack for Swordsmen)</li>
    </ul>

    <h2>Dynamic & World Systems</h2>
    <ul>
        <li>✅ On starting a new game, a unique Civilization with bonuses is generated</li>
        <li>✅ Random events occur periodically, presenting the player with choices</li>
        <li>✅ Player choices in events have consequences (gain/lose resources, items, etc.)</li>
        <li>✅ Player can acquire and use special items from an inventory</li>
        <li>✅ Special items provide one-time or temporary buffs</li>
        <li>✅ A game log ("Chronicles") tracks major events</li>
        <li>❌ AI-powered dynamic event generation based on game state</li>
    </ul>

    <h2>User Interface & Experience</h2>
    <ul>
        <li>✅ Interactive map for placing buildings and viewing resources</li>
        <li>✅ Pop-up panels for managing units and buildings</li>
        <li>✅ Main UI header displaying critical game state (resources, population, age)</li>
        <li>✅ Test Mode for developers (unlimited resources, instant build)</li>
        <li>✅ System for showing non-blocking error notifications</li>
        <li>❌ Mini-map for quick navigation</li>
        <li>❌ Unit grouping and control groups (e.g., Ctrl+1)</li>
    </ul>

  </div>
);
