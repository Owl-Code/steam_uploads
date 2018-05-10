local Array2D = require 'services.server.world_generation.array_2D'
local Rect2 = _radiant.csg.Rect2
local Point2 = _radiant.csg.Point2
local Cube3 = _radiant.csg.Cube3
local Point3 = _radiant.csg.Point3
local Region2 = _radiant.csg.Region2
local Region3 = _radiant.csg.Region3
local HeightMapCPP = _radiant.csg.HeightMap

local log = radiant.log.create_logger('CHMR')
log:always("Created CHMR")
local CustomHeightMapRenderer = class()

function CustomHeightMapRenderer:_add_mountains_to_region(region3, rect, height)
	local biome_name = stonehearth.world_generation:get_biome_alias()
	local colon_position = string.find (biome_name, ":", 1, true) or -1
	local mod_name_containing_the_biome = string.sub (biome_name, 1, colon_position-1)
	local fn = "_add_mountains_to_region_" .. mod_name_containing_the_biome
	if self[fn] ~= nil then
	   --found a function for the biome being used, named:
	   -- self:set_blueprint_<biome_name>(args,...)
	   self[fn](self, region3, rect, height)
	else
	   --there is no function for this specific biome, so call a copy of the original from stonehearth
	   self:_add_mountains_to_region_original(region3, rect, height)
	end
end

function CustomHeightMapRenderer:_add_mountains_to_region_original(region3, rect, height)
	local rock_layers = self._rock_layers
	local num_rock_layers = self._num_rock_layers
	local i, block_min, block_max
	local stop = false
 
	block_min = 0
 
	for i=1, num_rock_layers do
	   if (i == num_rock_layers) or (height <= rock_layers[i].max_height) then
		  block_max = height
		  stop = true
	   else
		  block_max = rock_layers[i].max_height
	   end
 
	   region3:add_unique_cube(Cube3(
			 Point3(rect.min.x, block_min, rect.min.y),
			 Point3(rect.max.x, block_max, rect.max.y),
			 rock_layers[i].terrain_tag
		  ))
 
	   if stop then return end
	   block_min = block_max
	end
end

function CustomHeightMapRenderer:_add_mountains_to_region_box_o_vox_boxland(region3, rect, height)	
	local rock_layers = self._rock_layers
	local num_rock_layers = self._num_rock_layers
	local i, block_min, block_max
	local stop = false

	block_min = 0

	--plains = 10, foothills = 15, mountains = 95
	local min_grass_height = 2 --last 2 steps
	for i=1, num_rock_layers do
		if (i == num_rock_layers) or (height <= rock_layers[i].max_height) then
			block_max = height
			stop = true
		else
			block_max = rock_layers[i].max_height
		end

		local has_grass = stop and block_max > min_grass_height
		local rock_top = has_grass and block_max-1 or block_max

		region3:add_unique_cube(Cube3(
			Point3(rect.min.x, block_min, rect.min.y),
			Point3(rect.max.x, rock_top, rect.max.y),
			rock_layers[i].terrain_tag
		))
		
		if has_grass then 
			local material = self._block_types.grass_hills or self._block_types.grass
			region3:add_unique_cube(Cube3(
				Point3(rect.min.x, rock_top, rect.min.y),
				Point3(rect.max.x, block_max, rect.max.y),
				material
			))
		end

		if stop then return end
		block_min = block_max
	end
end

return CustomHeightMapRenderer