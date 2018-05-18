local PlayerService = require 'stonehearth.services.server.player.player_service'
local Relations = require 'stonehearth.lib.player.relations'
local AllianceService = class()

function AllianceService:initialize()
    self._sv = self.__saved_variables:get_data()

    if not self._sv.current_alliance_map then
        self._sv.alliance_map = {}
    end
    self._player_alliances = Relations(self._sv.alliance_map)

    if not self._sv.players then
        self._sv.players = {}
    end
end

function AllianceService:add_allied(session, response, player_id)
    validator.expected_argument_types({'string'}, player_id)
    validator.expect.case(player_id ~= session.player_id, "playerId must be differnt that session id")

    local player_a = session.player_id
    local player_b = player_id
    self:create_alliance(player_a, player_b, 'ally')
    return true
end

function AllianceService:add_enemy(session, response, player_id)
    validator.expected_argument_types({'string'}, player_id)
    validator.expect.case(player_id ~= session.player_id, "playerId must be differnt that session id")

    local player_a = session.player_id
    local player_b = player_id
    self:create_alliance(player_a, player_b, 'enemy')
    return true
end

function AllianceService:remove_allied(session, response, player_id)
    validator.expected_argument_types({'string'}, player_id)
    validator.expect.case(player_id ~= session.player_id, "playerId must be differnt that session id")

    local player_a = session.player_id
    local player_b = player_id
    self:remove_alliance(player_a, player_b, 'ally')
    return true
end

function AllianceService:remove_allied(session, response, player_id)
    validator.expected_argument_types({'string'}, player_id)
    validator.expect.case(player_id ~= session.player_id, "playerId must be differnt that session id")

    local player_a = session.player_id
    local player_b = player_id
    self:remove_alliance(player_a, player_b, 'enemy')
    return true -- do i put reslove or return here i'm not sure
end

function AllianceService:get_alliance_map(session, response)
    respose:reslove({alliance_map = self._sv.alliance_map })
end

function AllianceService:create_alliance(player_a, player_b, alliance)
    checks('self', 'string', 'string', 'string')

    self._player_alliances:set_amenity(player_a, player_b, self:_alliance_map_key(alliance))
    self.__saved_variables:mark_changed()
 
    local pop = stonehearth.population:get_population(player_a)
    if pop then
       radiant.events.trigger_async(pop, 'stonehearth:amenity_changed', { other_player = player_b })
    end
 
    pop = stonehearth.population:get_population(player_b)
    if pop then
       radiant.events.trigger_async(pop, 'stonehearth:amenity_changed', { other_player = player_a })
    end
 
    -- trigger a global event sync
    radiant.events.trigger(radiant, 'stonehearth:amenity:sync_changed', { faction_a = player_a, faction_b = player_b })
 end

function AllianceService:remove_alliance(player_a, player_b, alliance)
    checks('self', 'string', 'string', 'string')

    self._player_alliances:set_amenity(player_a, player_b, self:_alliance_map_key(''))
    self.__saved_variables:mark_changed()
 
    local pop = stonehearth.population:get_population(player_a)
    if pop then
       radiant.events.trigger_async(pop, 'stonehearth:amenity_changed', { other_player = player_b })
    end
 
    pop = stonehearth.population:get_population(player_b)
    if pop then
       radiant.events.trigger_async(pop, 'stonehearth:amenity_changed', { other_player = player_a })
    end
 
    -- trigger a global event sync
    radiant.events.trigger(radiant, 'stonehearth:amenity:sync_changed', { faction_a = player_a, faction_b = player_b })
end

function AllianceService:_alliance_map_key(alliance)
    if alliance == 'ally' then
        return 'friendly'
    elseif alliance == 'enemy' then
        return 'hostile'
    else 
        return 'neutral'
    end
end

return AllianceService