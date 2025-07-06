// This file is a non-rendered TSX file for documentation purposes.
// It outlines the core features, game flows, and user/system actions
// within the Gemini Empires application. This helps in understanding the
// application's architecture and potential areas for AI integration.

import React from 'react';

// =================================================================
// 1. CORE GAME FEATURES
// =================================================================
const CoreFeatures = () => (
  <div id="feature-documentation">
    <div id="feature-resource-management">
      <h2>Resource Management</h2>
      <p>Gathering Food, Wood, Gold, and Stone. Villagers are assigned to nodes and gather resources over time. Resources are required for all major actions.</p>
    </div>
    <div id="feature-construction-system">
      <h2>Building & Construction</h2>
      <p>Users can construct a variety of buildings, each with unique costs, build times, and functions (e.g., increasing population, unlocking units).</p>
    </div>
    <div id="feature-unit-training">
      <h2>Unit Training & Population</h2>
      <p>Users train Villagers (economic units) and Military units (combat units). Population capacity is determined by Houses and the Town Center.</p>
    </div>
    <div id="feature-age-progression">
      <h2>Age Progression</h2>
      <p>The civilization advances through ages (Nomadic, Feudal, etc.), unlocking new possibilities. This is a major strategic milestone.</p>
    </div>
    <div id="feature-dynamic-events">
      <h2>Random Events</h2>
      <p>The game presents periodic events with choices that impact the game state, creating a unique narrative.</p>
    </div>
    <div id="feature-civilization-bonuses">
      <h2>Civilization Bonuses</h2>
      <p>Each new game features a unique civilization with its own lore, economic bonus, and special unit.</p>
    </div>
    <div id="feature-game-persistence">
      <h2>Saving & Loading</h2>
      <p>Game state is automatically saved to the browser's IndexedDB, allowing players to resume their sagas.</p>
    </div>
     <div id="feature-map-and-placement">
      <h2>Interactive Game Map</h2>
      <p>A grid-based map where players place buildings and interact with resource nodes. It's the central canvas for the game world.</p>
    </div>
  </div>
);


// =================================================================
// 2. USER & SYSTEM FLOWS / ACTIONS
// =================================================================
const GameFlowsAndActions = () => (
  <div id="flow-documentation">

    {/* Game Lifecycle Flows */}
    <section id="flow-group-lifecycle">
      <h3>Game Lifecycle</h3>
      <div id="action-start-new-game">
        <h4>Start New Game</h4>
        <p>User enters a name for their new saga and clicks 'Begin'. This initializes a new game state, generates a civilization, and transitions the view to the main game UI.</p>
        {/* Associated Components: StartScreen, GamePage (handleStartNewGame) */}
      </div>
      <div id="action-resume-saved-game">
        <h4>Resume Saved Game</h4>
        <p>User selects a previously saved game from a list. The application loads the state from IndexedDB and transitions to the main game UI.</p>
        {/* Associated Components: StartScreen, GamePage (handleResumeGame), dbService */}
      </div>
      <div id="action-exit-to-menu">
        <h4>Exit to Main Menu</h4>
        <p>User clicks the exit icon in the game header. Current game state is saved, and the view returns to the StartScreen.</p>
        {/* Associated Components: GameUI, GamePage (handleExitGame) */}
      </div>
    </section>

    {/* Resource Management Flows */}
    <section id="flow-group-resource-management">
      <h3>Resource Management</h3>
      <div id="action-view-resources">
        <h4>View Resources & Deltas</h4>
        <p>User observes the top header to see current totals of Food, Wood, Gold, and Stone. Animated deltas appear when resources are gained or lost.</p>
        {/* Associated Components: GameUI (HeaderStat) */}
      </div>
      <div id="action-assign-villager-to-resource">
        <h4>Assign Villagers to Gather</h4>
        <p>User clicks a resource node (e.g., Forest) on the map, opening the ResourceAssignmentPanel. They select a number of idle villagers and click 'Assign'. The villagers become busy, and a gathering task is created.</p>
        {/* Associated Components: GameMap, ResourceAssignmentPanel, GamePage (handleAssignVillagersToNode) */}
      </div>
      <div id="action-recall-villager-from-resource">
        <h4>Recall Villagers from Gathering</h4>
        <p>From the ResourceAssignmentPanel, the user can see which villagers are assigned and can choose to recall them, making them idle again.</p>
         {/* Note: This is a target for improvement. Currently, all villagers are recalled when the node is depleted. */}
      </div>
    </section>

    {/* Construction Flows */}
    <section id="flow-group-construction">
      <h3>Building & Construction</h3>
      <div id="action-initiate-build">
        <h4>Initiate Build Action</h4>
        <p>User opens the Villager Management Panel, finds an idle villager, and clicks their 'Construct' icon. This opens the BuildPanel, anchored to the button.</p>
        {/* Associated Components: UnitManagementPanel, GamePage (handleInitiateBuild) */}
      </div>
       <div id="action-select-and-place-building">
        <h4>Select & Place a Building</h4>
        <p>From the BuildPanel, the user selects a building. This triggers 'placement mode'. The user then clicks a valid, unoccupied tile on the GameMap to confirm construction. Resources are spent, and a build task begins.</p>
        {/* Associated Components: BuildPanel, GameMap, GamePage (handleStartPlacement, handleConfirmPlacement) */}
      </div>
      <div id="action-cancel-placement">
        <h4>Cancel Building Placement</h4>
        <p>While in 'placement mode', the user can right-click the mouse or press the 'Escape' key to cancel the action without spending resources.</p>
        {/* Associated Components: GameMap, GamePage (handleCancelPlayerAction) */}
      </div>
       <div id="action-demolish-building">
        <h4>Demolish a Building</h4>
        <p>User clicks a building on the map, opens the BuildingManagementPanel, and clicks the 'Demolish' icon on a specific building instance. Half the resources are refunded.</p>
        {/* Associated Components: GameMap, BuildingManagementPanel, GamePage (handleDemolishBuilding) */}
      </div>
      <div id="action-rename-building">
        <h4>Rename a Building</h4>
        <p>From the BuildingManagementPanel, the user can edit and save a new name for any building instance.</p>
        {/* Associated Components: BuildingManagementPanel, GamePage (handleUpdateBuilding) */}
      </div>
    </section>

    {/* Unit Management Flows */}
    <section id="flow-group-unit-management">
      <h3>Unit Management</h3>
      <div id="action-train-villager">
        <h4>Train Villager</h4>
        <p>User clicks the Town Center, opening its management panel. They then click the 'Train Villager' action. If resources and population capacity are sufficient, a training task begins.</p>
        {/* Associated Components: BuildingManagementPanel, GamePage (handleTrainVillagers) */}
      </div>
      <div id="action-train-military">
        <h4>Train Military Unit</h4>
        <p>User clicks a military building (e.g., Barracks), opening its management panel. They select the number of units to train and click the 'Train' button. If resources/pop are sufficient, a task begins.</p>
        {/* Associated Components: BuildingManagementPanel, GamePage (handleTrainUnits) */}
      </div>
      <div id="action-manage-units">
        <h4>Manage Units</h4>
        <p>User clicks the Villager or Military stat box to open the UnitManagementPanel. From here, they can view, rename, or dismiss individual units.</p>
        {/* Associated Components: GameUI, UnitManagementPanel, GamePage (onOpenUnitPanel) */}
      </div>
    </section>

    {/* High-Level Gameplay Flows */}
    <section id="flow-group-gameplay">
      <h3>High-Level Gameplay</h3>
      <div id="action-advance-age">
        <h4>Advance to Next Age</h4>
        <p>User opens the Town Center panel and clicks the 'Advance Age' action. This costs a large number of resources and takes time, but unlocks major benefits upon completion.</p>
        {/* Associated Components: BuildingManagementPanel, GamePage (handleAdvanceAge) */}
      </div>
      <div id="action-handle-event">
        <h4>Handle Game Event</h4>
        <p>Periodically, the game pauses other long-term timers and presents a modal with a scenario and choices. The user's choice affects game state (e.g., gaining/losing resources) and logs the outcome.</p>
        {/* Associated Components: GameUI, GamePage (handleEventChoice) */}
      </div>
    </section>

    {/* Meta / Settings Flows */}
    <section id="flow-group-settings">
      <h3>Settings & Meta Actions</h3>
      <div id="action-open-settings">
        <h4>Open Settings</h4>
        <p>User clicks the settings (gear) icon in the top header to open the SettingsPanel.</p>
        {/* Associated Components: GameUI, GamePage (onOpenSettingsPanel) */}
      </div>
      <div id="action-adjust-ui-opacity">
        <h4>Adjust UI Opacity</h4>
        <p>From the SettingsPanel, the user moves a slider to change the opacity of all pop-up panels for better visibility of the map.</p>
        {/* Associated Components: SettingsPanel, GamePage */}
      </div>
       <div id="action-toggle-test-mode">
        <h4>Toggle Test Mode</h4>
        <p>A persistent button on the main game screen allows the user to toggle 'Test Mode', which grants unlimited resources and instant build/train times for easier testing.</p>
        {/* Associated Components: GamePage (handleToggleUnlimitedResources) */}
      </div>
    </section>

  </div>
);


// =================================================================
// 3. POTENTIAL GEMINI / AI INTERACTIONS
// =================================================================

const GeminiInteractions = () => (
    <div id="gemini-interaction-points">
        <div id="ai-event-generation">
            <h4>Dynamic Event Generation</h4>
            <p>The flow for `action-handle-event` could be powered by Gemini. Instead of pulling from a predefined list, a prompt could be constructed with the current game state (resources, army size, age) to generate a unique, contextually relevant event and choices.</p>
            {/* Target Flow: `handleNewEvent` in GamePage.tsx */}
            {/* Target AI File: `src/ai/flows/generate-game-event.ts` (new) */}
        </div>
        <div id="ai-civ-generation">
            <h4>Civilization Generation</h4>
            <p>The `action-start-new-game` flow could be enhanced. A Gemini flow could generate the civilization's name, lore, and bonus text. A separate call to an image model could generate a unique banner based on the generated name and lore.</p>
            {/* Target Flow: `handleStartNewGame` in GamePage.tsx */}
            {/* Target AI File: `src/ai/flows/generate-civilization.ts` (new) */}
        </div>
        <div id="ai-name-generation">
            <h4>Unit & Building Name Generation</h4>
            <p>Instead of pulling from static lists, actions like `action-train-villager`, `action-train-military`, and `action-select-and-place-building` could call a small Gemini flow to generate thematic names for new units and buildings based on the civilization's lore.</p>
            {/* Target Flow: `getRandomNames` in nameService.ts could be replaced by an AI call. */}
        </div>
         <div id="ai-game-chronicles">
            <h4>AI-Powered Game Log</h4>
            <p>The game log could be more narrative. After key events (like advancing an age or winning a major battle that doesn't exist yet), a Gemini flow could write a more descriptive, story-like log entry for the "Chronicles" section.</p>
            {/* Target Flow: `addToLog` could be wrapped with an AI call for specific icon types. */}
        </div>
    </div>
);
