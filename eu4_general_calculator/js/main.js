$(document).ready(function(){
    var page = new Page();
    page.init();
    page.loadData();
    page.update();
});

var colors = {none:'white', low:'red', lowmid:'orange',highmid:'goldenrod', high:'green' };
function getColor(val){
    if(val === 0){
        return colors.none;
    } else if (val >0 && val < 25 ){
        return colors.low;
    } else if (val >=25 && val < 50){
        return colors.lowmid;
    } else if (val >= 50 && val < 75){
        return colors.highmid;
    } else if (val >=75){
        return colors.high;
    }
}

function Page(){
    this.graph = new Graph();
    this.pip_table = new Table('#pip_range_table');
}

Page.prototype = {
    constructor: Page
};

Page.prototype.init = function(){
    var that = this;
    var army_tradition_input = $('#army_tradition');
    var ruler_stat_input = $('#ruler_stat');
    this.graph.stats.userinput_at = parseInt(army_tradition_input.val());
    this.graph.stats.userinput_rulerstat = parseInt(ruler_stat_input.val());

    ruler_stat_input.change(function(){
        that.graph.stats.userinput_rulerstat = parseInt($(this).val());
    });
    army_tradition_input.change(function(){
        that.graph.stats.userinput_at = parseInt($(this).val());
    });

    $('#calculate').click(function(){
        that.update();
    });
    $('#general_roll_btn').click(function(){
        that.displayGeneral();
    });
};

Page.prototype.loadData = function(){
    var that = this;
    $.get("data/data.json", function(data){
        that.displayNationInputs(data['nations']);
        that.displayIdeaInputs(data['ideas']);
        that.displayPolicyInputs(data['policies']);
    });
};

Page.prototype.update = function(){
        this.graph.calcData();
        this.displayPipData();
        this.graph.show();
        this.pip_table.draw(this.graph.data);
};

Page.prototype.displayPipData = function(){
    $('#eff_army_trad').html(this.graph.stats.getEffectiveAT());
    $('#guaranteed_pips').html(this.graph.stats.pips.guaranteed());
    $('#min_pip_value').html(this.graph.stats.calcMinPips());
    $('#avg_pip_value').html(this.graph.stats.calcAvgPips());
    $('#max_pip_value').html(this.graph.stats.calcMaxPips());
};

Page.prototype.displayNationInputs = function(nationdata){
    var that = this;
    var nationsElem = $('#nations');
    var nations_select = nationsElem.find('select');
    var custom_nation_div = nationsElem.find('#custom_nation');
    // other zero pip nations
    nations_select.append('<option id="0_other">Other</option>');
     // custom nations (up to 8 pips)
    nations_select.append('<option id="8_custom">Custom Nation</option>');

    //divider
    nations_select.append('<option disabled>----------------</option>');
    // 1-2 pip nations
    for(var d in nationdata){
        var pip_group = nationdata[d];
        for(var pip in pip_group){
            var nations = pip_group[pip];
            $.each(nations, function(key,value){
                var option = $(document.createElement("option"));
                option.attr('id', pip+'_'+value);
                option.text(value);
                nations_select.append(option);
            });
        }
    }

    // event handlers
    nations_select.change(function(){
        var selected_id = $(this).find(':selected').attr('id');
        if(selected_id === '8_custom'){
            custom_nation_div.show();
            that.graph.stats.pips.nation = parseInt(get_pips_from_id($('#custom_nation_input').val()));
        } else {
            custom_nation_div.hide();
            that.graph.stats.pips.nation = parseInt(get_pips_from_id(selected_id));
        }
        that.updatePipInput();
    });

    function customNationValueChange(parent){
        that.graph.stats.pips.nation = parseInt(parent.val());
        that.updatePipInput();
    }

    $('#custom_nation_input').change(function(){
        customNationValueChange($(this));

    });
};

Page.prototype.displayIdeaInputs = function(ideadata){
    // list idea data
    var that = this;
    var idea_group_list = $('#ideas').find('ul');
    for(var d in ideadata){
        var pip_group = ideadata[d];
        for(var pip in pip_group){
            var ideas = pip_group[pip];
            $.each(ideas, function(key, value){
                var id = pip+'_'+value;
                var checkbox = $(document.createElement('input'));
                var label = $(document.createElement('label'));
                var li = $(document.createElement('li'));
                checkbox.attr('type', 'checkbox');
                checkbox.attr('id', id);
                label.attr('for', id);
                label.html(value);
                checkbox.change(function(){
                    var val = parseInt($(this).attr('id').split('_')[0]);
                    if($(this).prop('checked')){
                        that.graph.stats.pips.idea += val;
                    } else {
                        that.graph.stats.pips.idea -= val;
                    }
                    that.updatePipInput();
                });

                li.append(checkbox);
                li.append(label);
                idea_group_list.append(li);
            });
        }
    }
};

Page.prototype.displayPolicyInputs = function(policydata){
    // list policy data
    var that = this;
    var policy_group_list = $('#policies').find('ul');
    // add handlers so that policies are enabled iff prereq ideagroups are selected
    for(var d in policydata){
        var pip_group = policydata[d];
        for(var pip in pip_group){
            var policies = pip_group[pip];
            $.each(policies, function(key, value){
                var li = $(document.createElement('li'));
                var checkbox = $(document.createElement('input'));
                var label = $(document.createElement('label'));
                var id = pip+'_'+value[0]+'_'+value[1];
                checkbox.attr('id', id);
                checkbox.attr('type', 'checkbox');
                label.attr('for', id);
                label.html(value[0]+' + '+value[1]);

                // event handlers
                checkbox.on('change', function(){
                   var val = parseInt($(this).attr('id').split('_')[0]);
                   if($(this).prop('checked')){
                        that.graph.stats.pips.policy += val;
                   } else {
                        that.graph.stats.pips.policy -= val;
                   }
                   that.updatePipInput();
                });

                // Append elements
                li.append(label);
                li.append(checkbox);
                li.append(label);
                policy_group_list.append(li);
            });
        }
    }

};

Page.prototype.updatePipInput = function(){
    $('#guaranteed_pips_input').val(this.graph.stats.pips.guaranteed());
};
Page.prototype.displayGeneral = function(){
    var general = this.graph.stats.rollGeneral();
    // display general
    $('#rolled_pips').html(general.total());
    var percentile_rank = general.percentile(this.graph.data);
    var gen_percentile_elem = $('#gen_percentile');
    gen_percentile_elem.html(percentile_rank+'%');
    gen_percentile_elem.css('background', function(){
        return getColor(percentile_rank);
    });
    $('#gen_percentile2').html(percentile_rank);
    $('#fire_value').html(general.fire);
    $('#shock_value').html(general.shock);
    $('#maneuver_value').html(general.maneuver);
    $('#siege_value').html(general.siege);

};

function Table(id){
    this.id = id;
    this.table = d3.select(this.id).append('table')
        .style('border-collapse', 'collapse')
        .style('border', '2px solid black');
    this.table.append('thead');
    this.body = this.table.append('tbody');
    this.valrow = this.body.append('tr');
}

Table.prototype = {
    constructor: Table
};

Table.prototype.draw = function(data){
    this.valrow.selectAll('td').remove();
    this.valrow.selectAll('td')
        .data(data)
        .enter()
        .append('td')
        .style('border', '2px solid black')
        .style('text-align', 'center')
        .style('background-color', function(d){
            return getColor(d.prob);
        })
        .html(function(d){return d.prob+'%';});

};

function Graph(){
    this.stats = new Stats();
    this.data = [];
    this.margin = {top: 20, right: 20, bottom: 50, left: 70};
    this.width = 960 - this.margin.left - this.margin.right;
    this.height = 500 - this.margin.top - this.margin.bottom;

    // ranges
    this.xRange = d3.scaleBand().range([0, this.width]).padding(0.1);
    this.yRange = d3.scaleLinear().range([this.height, 0]);
    this.svg = d3.select('#graph').append('svg')
                    .attr('width', this.width + this.margin.left + this.margin.right)
                    .attr('height', this.height + this.margin.top + this.margin.bottom)
                .append('g')
                    .attr('transform', 'translate('+this.margin.left+','+this.margin.top+')');
    // x and y axis
    this.x_axis = d3.axisBottom(this.xRange).ticks(25);
    this.y_axis = d3.axisLeft(this.yRange);
    this.y_gridlines = d3.axisLeft(this.yRange);
    // x-axis label

    this.svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', 'translate(0,'+this.height+')');

    this.svg.append('text')
        .attr('transform', 'translate('+(this.width / 2)+' ,'+(this.height + this.margin.top +20)+')')
        .style('text-anchor', 'middle')
        .text('Number of Total Pips');

    this.svg.append('g').attr('class', 'y-axis');
    // y-axis label
    this.svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - this.margin.left)
        .attr('x', 0 - (this.height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .text('% of total Generals spawned out of '+this.stats.sample_count);

    // horizontal grid-line
    this.svg.append('g')
        .attr('class', 'gridline');

    this.tooltip = d3.select('#graph')
                    .append('div')
                    .attr('class', 'bar_tooltip')
                    .style('opacity', 0);  // set opacity to null

}

Graph.prototype = {
    constructor: Graph
};

Graph.prototype.calcData = function(){
    // x: pips  y: sample_count
    this.data = [];
    this.stats.generateSamples();
    for(var pip in this.stats.sample_rolls){
        var p = roundDown(percentage(this.stats.sample_rolls[pip],this.stats.sample_count),2);
        this.data.push({pips:pip, prob: p});
    }
};

Graph.prototype.show = function(){
    var that = this;
    // scale the range of the data to the domains
    this.xRange.domain(this.data.map(function(d){return d.pips;}));
    this.yRange.domain([0,d3.max(this.data.map(function(d){return d.prob;}))]);

    // remove all bars TODO: use exit() selection (problem: is always empty somehow??)
    this.svg.selectAll('.bar').remove();
    var bars = this.svg.selectAll('.bar').data(this.data);
    bars.enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', function(d){return that.xRange(d.pips);})
            .attr('width', this.xRange.bandwidth())
            .attr('y', function(d){return that.yRange(d.prob);})
            .attr('height', function(d){ return that.height - that.yRange(d.prob);})
            .on('mouseover', function(d){
                that.tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
                that.tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                that.tooltip.html('<p>'+d.prob+'\%</p>'+'<p>'+that.stats.sample_rolls[d.pips]+'</p>')
                    .style('left', (d3.event.pageX)+'px')
                    .style('top', (d3.event.pageY - 28)+'px');
            });

    // Axes
    this.svg.select('.x-axis').call(this.x_axis);
    this.svg.select('.y-axis').call(this.y_axis);

    // Gridline
    this.svg.select('.gridline').call(this.y_gridlines.tickFormat('').tickSize(-this.width));
};

function Pips(){
    this.nation = 0;
    this.idea = 0;
    this.policy = 0;
}


Pips.prototype = {
    constructor: Pips,
    guaranteed: function(){
        return this.nation + this.idea + this.policy;
    }    
};


function Stats(){
    this.sample_count = 10000;
    this.pips = new Pips();
    this.general_type = 0;
    this.userinput_at = 0;
    this.userinput_rulerstat = 0;
    this.sample_rolls = [];
}

Stats.prototype = {
    constructor: Stats,
    d6: function(){return getRandIntInclusive(1,6);}, // roll a dice with 6 sides
    d10: function(){return getRandIntInclusive(1,10);}  // roll dice with 10 sides
};

Stats.prototype.randomVar = function(chance){
    if(chance <= 0){
        return 0;
    }
    // returns 1 with chance% probability (cF: http://stackoverflow.com/questions/8877249/generate-random-integers-with-probabilities)
    var index = Math.floor(Math.random() * 100);
    // return item from sample space (first #chance items are 1, rest is 0
    return (index <= chance)? 1 : 0;
};

Stats.prototype.rollGeneral = function(){
    var general = {fire:0, shock: 0, maneuver: 0, siege: 0,
                   total: function(){
                            return this.fire + this.shock + this.maneuver + this.siege;
                        },
                   percentile: function(data){
                       return percentileRank(data, this.total());
                   }
                  };

    var effectiveAT = this.getEffectiveAT();
    // generate pool of points
    var pool = this.d6() + (Math.floor(effectiveAT/20))
                         + this.randomVar(effectiveAT)
                         + this.randomVar(effectiveAT - 20)
                         + this.randomVar(effectiveAT - 40)
                         + this.randomVar(effectiveAT - 60)
                         + this.randomVar(effectiveAT - 80)
                         + this.randomVar(50);

    // distribute 4 points per ability (at most twice, since max(poolsize) = 17
    while(pool > 10){
        general.fire++;
        general.shock++;
        general.maneuver++;
        general.siege++;
        pool -= 4;
    }
    // assign bonus pips
    pool += this.pips.guaranteed();

    while(pool > 0 ) {
        var which = this.d10();
        if (which === 1 && general.siege < 6) {
            general.siege++;
            pool--;
        } else if (which < 5 && general.shock < 6) {
            general.shock++;
            pool--;
        } else if (which < 8 && general.fire < 6) {
            general.fire++;
            pool--;
        } else if (general.maneuver < 6) {
            general.maneuver++;
            pool--;
        }
        if(general.total() === 24){
            break;
        }
    }
    return general;
};


Stats.prototype.calcStdDev = function(){
    //TODO
    return 0;
};


Stats.prototype.getEffectiveAT = function(){
    if(this.general_type === 0){
        return this.userinput_at;
    } else if (this.general_type === 1){
        return (this.userinput_at/2) + 7*this.userinput_rulerstat;
    } else if(this.general_type === 2){
        return this.userinput_at*0.8;
    }
};

Stats.prototype.getArmyTradition = function(i){
        return this.getEffectiveAT() - i*20;
};

Stats.prototype.calcMinPips = function(){
    return 1 + this.pips.guaranteed()
             + roundDown((this.getArmyTradition(0) / 20),2)
             + ((this.getArmyTradition(0)===100)? 1: 0);
};

Stats.prototype.calcAvgPips = function(){
    return roundDown(sum(this.sample_rolls.map(function(d,i){return d*(i+1);}))/ this.sample_count, 2);
};

Stats.prototype.calcMaxPips = function(){
    var x = 6 + 1
              + roundDown((this.getArmyTradition(0)/20),2)
              + (((this.getArmyTradition(0)/20)>0)?1:0)
              + (((this.getArmyTradition(1)/20)>0)?1:0)
              + (((this.getArmyTradition(2)/20)>0)?1:0)
              + (((this.getArmyTradition(3)/20)>0)?1:0)
              + (((this.getArmyTradition(4)/20)>0)?1:0)
              + this.pips.guaranteed();
    return Math.min(x, 24);
};

Stats.prototype.generateSamples = function(){
    this.sample_rolls = [];
    for(var i=0; i<25;i++){
        this.sample_rolls[i] = 0;
    }
    var that = this;
    function sampleRoll(){
        return getRandIntInclusive(1,6)
                + getRandIntInclusive(0,1)
                + roundDown((that.getArmyTradition(0)/20),0)
                + ((that.randomVar(that.getArmyTradition(0))||(that.getArmyTradition(0)==100))?1:0)
                + that.randomVar(that.getArmyTradition(1))
                + that.randomVar(that.getArmyTradition(2))
                + that.randomVar(that.getArmyTradition(3))
                + that.randomVar(that.getArmyTradition(4))
                + that.pips.guaranteed();
    }

    for(var s=0; s<this.sample_count; s++){
        var roll = sampleRoll();
        this.sample_rolls[(roll > 24)?24:roll] += 1;
    }

};


// Helpers

function get_pips_from_id(id_string){
    var id = id_string.split('_')[0];
    return parseInt(id);
}

function sum(array){
    return array.reduce(function(x,y){return x + y},0);
}

function getRandIntInclusive(min, max){
    return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) +1)) + Math.ceil(min);
}
function roundDown(value, places){
    //noinspection JSCheckFunctionSignatures
    return +(Math.round(value + "e+"+places) + "e-"+places);
}

function percentileRank(data, value){
    var lowerCount = data.reduce(function(total, x){return (x.pips<value)? total+1 : total;},0);
    var sameCount = data.reduce(function(total, x){return (x.pips===value)? total+1 : total;},0);
    return roundDown(((lowerCount + (0.5*sameCount))/data.length)*100,2);
}

function percentage(value, total){
    return (100/total)*value;
}