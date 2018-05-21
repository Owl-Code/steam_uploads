local Relations = require 'stonehearth.lib.player.relations'

local Entity = _radiant.om.Entity
local validator = radiant.validator

local PlayerService = class()
function PlayerService:debug_set_amenity_command(session, response, player_id, amenity)
   validator.expect_argument_types({'string', 'string'}, entity, amenity)

   local player_a = session.player_id
   local player_b = player_id

   self:set_amenity(player_a, player_b, amenity)
   return true
end

-- override the default calcuation for the amenity between two players with
-- the specified `amenity`.  setting the amenity to nil will revert back
-- to the computed behavior.
--
return PlayerService
