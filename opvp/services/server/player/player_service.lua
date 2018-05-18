local Relations = require 'lib.player.relations'

local Entity = _radiant.om.Entity
local validator = radiant.validator

local PlayerService = class()
function PlayerService:debug_set_amenity_command(session, response, player_a, player_b, amenity)
      validator.expect_argument_types({'string', 'string', 'string'}, player_a, player_b, amenity)

      self._player_relations:set_amenity(player_a, player_b, amenity)
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
   return true
end
-- override the default calcuation for the amenity between two players with
-- the specified `amenity`.  setting the amenity to nil will revert back
-- to the computed behavior.
--
return PlayerService
