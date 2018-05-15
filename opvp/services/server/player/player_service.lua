local Relations = require 'stonehearth.lib.player.relations'
local Entity = _radiant.om.Entity
local validator = radiant.validator
local ogPlayerService = require 'stonehearth.services.server.player.player_service'
local PlayerService = class()


function PlayerService:set_amenity_command(session, response, player_a, player_b, amenity)
      validator.expect_argument_types({'string', 'string', 'string'}, player_a, player_b, amenity)
   
      ogPlayerService:set_amenity(player_a,player_b, amenity)
      return true
end

return PlayerService
