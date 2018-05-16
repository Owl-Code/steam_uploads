local Relations = require 'stonehearth.lib.player.relations'
local Entity = _radiant.om.Entity
local validator = radiant.validator
local PlayerService = class()
local log = radiant.log.create_logger('player')


function PlayerService:set_amenity_command(session, response, player_a, player_b, amenity)
      validator.expect_argument_types({'string', 'string', 'string'}, player_a, player_b, amenity)
      log:always("player_a: %s | player_b: %s | amenity: %s", player_a, player_b,amenity)
      Relations:set_amenity(player_a,player_b, amenity)
      log:always("Relations: %s", Relations:get_amentiy(player_a, player_b))
      response:resolve({})
end

return PlayerService
