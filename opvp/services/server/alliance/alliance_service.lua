local PlayerService = require 'stonehearth.services.server.player.player_service'
local Relations = require 'stonehearth.lib.player.relations'
local AllianceService = class()

function AllianceService:initialize()
end

function AllianceService:add_allied(session, response, player_id)
    validator.expected_argument_types({'string'}, player_id)
    stonehearth.player:set_amenity(session.player_id, player_id, "friendly")
    return true
end

function AllianceService:add_neutral(session, response, player_id)
    validator.expected_argument_types({'string'}, player_id)
    stonehearth.player:set_amenity(session.player_id, player_id, "neutral")
    return true
end

function AllianceService:add_enemy(session, response, player_id)
    validator.expected_argument_types({'string'}, player_id)
    stonehearth.player:set_amenity(session.player_id, player_id, "hostile")
    return true
end

return AllianceService