'use strict';
const maxPts = 100;
let debug = false;
let removePtTime = .5;
let inFullScreen = false;


function interpolate(start, end, progress, interpolateFunct = sineProgress)
{
	if (Array.isArray(start) && Array.isArray(end))
	{
		let out = Array(start.length);
		for (var i = 0; i<start.length; i++)
		{
			out[i] = interpolate(start[i], end[i], progress, interpolateFunct)
		}
		return out;
	}
	progress = interpolateFunct(progress);
	return start*progress+end*(1-progress);
}
function sineProgress(progress)
{
	return ((Math.cos(progress*Math.PI)+1)*.5)
}

class point {
	constructor(initLoc = [Math.random(), Math.random()])
	{
		this.startPos = initLoc;
		this.currPos = initLoc;
		this.nextPos = [Math.random(), Math.random()];
		this.posQueue = [];
		this.currTime = 0;
		// this.interpolateTime = Math.random()*.5+.75;
		this.interpolateTime = removePtTime;
		this.longLoop = false;
	}
	reset()
	{
		this.startPos = this.currPos;
		this.currTime = 0;
		// this.interpolateTime = Math.random()*.5+.75;
		this.interpolateTime = removePtTime;
		this.longLoop = false;
	}
	setTime(time)
	{
		this.currTime = time;
	}
	setPos(pos = [0, 0])
	{
		this.startPos = pos;
		this.currPos = pos;
		this.currTime = 0;
	}
	changeNextPos(pos = [0, 0])
	{
		this.startPos = this.currPos;
		this.nextPos = pos;
		this.currTime = 0;
	}
	update(dt, asGt = false)
	{
		if (asGt)
		{
			this.currTime = dt;
		}
		else
		{
			this.currTime += dt;
		}
		if (this.interpolateTime <= this.currTime)
		{
			this.atTurnPt();
			return; // else do below if
		}
		this.currPos = interpolate(this.startPos, this.nextPos, this.currTime/this.interpolateTime);
	}
	atTurnPt()
	{
		this.currPos = this.nextPos;
		this.startPos = this.nextPos;
		if (this.posQueue.length < 1)
		{
			this.nextPos = [Math.random(), Math.random()];
			this.posQueue.unshift(this.nextPos);
		}
		this.nextPos = this.posQueue.pop();
		this.longLoop = !this.longLoop;
		this.currTime = 0;
		this.interpolateTime=.5+this.interpolateTime*1.1;
	}
	posAfterSeconds(seconds)
	{
		// if (seconds+this.currTime>this.interpolateTime)
			let tmpTime = seconds+this.currTime;
			let tmpInterTime = this.interpolateTime; 
			let index = 0;
			while(tmpTime>tmpInterTime)
			{
				tmpTime-=tmpInterTime;
				tmpInterTime=.5+tmpInterTime*1.1;
				index++;
			}
			// tmpInterTime*=.5;
			const start = this.getFromPosQueue(index);
			const end = this.getFromPosQueue(index+1);
			return interpolate(start, end, (tmpTime)/tmpInterTime);
	}
	getFromPosQueue(index)
	{
		if (index == 0)
		{
			return this.startPos;
		}
		if (index == 1)
		{
			return this.nextPos;
		}
		for (var i = this.posQueue.length; i<=index; i++)
		{
			this.posQueue.unshift([Math.random(), Math.random()])
		}
		return this.posQueue[this.posQueue.length-index+1];
	}
	getPosInPx(startX, width, startY, height)
	{
		return [this.currPos[0]*width+startX, this.currPos[1]*height+startY];
	}
}

class ColorFader {
	/**
	 * @param {number[]} startColor rgb in number array - ex. [255, 255, 255]
	 */
	constructor(startColor, interpTime=.25)
	{
		this.startCol = startColor;
		this.baseCol = startColor;
		this.interpTime = interpTime;
		this.currCol = this.startCol;
		this.nextCols = [];
		this.time = 0;
	}
	isColsEqual(col1, col2)
	{
		return col1[0] === col2[0] &&
					 col1[1] === col2[1] &&
					 col1[2] === col2[2];
	}
	addToFades(newColor, transitionTime = this.interpTime)
	{
		if (this.nextCols.length === 0 
				// || !this.isColsEqual(this.nextCols[this.nextCols.length-1], newColor)
				// || !this.isColsEqual(this.nextCols[this.nextCols.length-2], this.nextCols[this.nextCols.length-1])
				)
		{
			this.time = 0;
			this.nextCols.push({"newCol":newColor, "transitionTime":transitionTime});
		}
	}
	getColor()
	{
		return this.currCol;
	}
	update(dt)
	{
		this.time += dt;
		if (this.nextCols.length>0)
		{
			if (this.time>=this.interpTime)
			{
				this.time-=this.interpTime;
				this.interpTime = this.nextCols[0].transitionTime;
				this.startCol = this.nextCols.shift().newCol;
			}
			else
			{
				this.currCol = interpolate(this.startCol, this.nextCols[0].newCol, this.time/this.interpTime);
			}
		}
		else{
			if (this.time>this.interpTime)
			{
				this.time -= this.interpTime;
				this.startCol = this.currCol;
			}
			this.currCol = interpolate(this.startCol, this.baseCol, this.time/this.interpTime);
		}
	}
}

const colFader = new ColorFader([255, 255, 255], removePtTime);

let debugDot = new point([0, 0]);

const ptStorage = [];
const pts = [];
for (var i = 0; i<5000; i++)
{
	ptStorage.push(new point())
}
function addToPts()
{
	if (pts.length<ptStorage.length)
	{
		pts.push(ptStorage[pts.length]);
		if (pts.length>1)
		{
			pts[pts.length-1].reset();
			const p1 = pts[0].currPos;
			const p2 = pts[pts.length-2].currPos;
			const midPt = [(p1[0]+p2[0])/2, (p1[1]+p2[1])/2]
			pts[pts.length-1].setPos(midPt)
		}
	}
	else
	{
		throw 'Out of dots!'
	}
}
let removeQueCt = 0;
let currentlyRemoving = -1;
let currentlyRemovingPt;
function removeFromPts()
{
	if (pts.length-removeQueCt<2)
	{
		if (pts.length == 1)
		{
			reset();
		}
		return;
		// throw "removing more pts than present"; handled??
	}
	ctOfPtsToAdd = 0;
	removeQueCt++;
	if (removeQueCt>0 && !currentlyRemovingPt)
	{
		currentlyRemoving = pts.length-1;
		currentlyRemovingPt = pts[currentlyRemoving];
		setupPtForRemoval(currentlyRemovingPt, currentlyRemoving, removePtTime);
	}
}
function actuallyRemovePt()
{
	pts.splice(currentlyRemoving, 1);
	removeQueCt--;
	if (removeQueCt>0)
	{
		currentlyRemoving = pts.length-1;
		
		currentlyRemovingPt = pts[currentlyRemoving];
		setupPtForRemoval(currentlyRemovingPt, currentlyRemoving, removePtTime);
	}
	else
	{
		currentlyRemovingPt = null;
		currentlyRemoving = -1;
	}
}
function setupPtForRemoval(pt, ptInd, timeToPosition)
{
	const p1attime = pts[ptInd-1].posAfterSeconds(timeToPosition);
	debugDot.setPos(p1attime);
	const p2attime = pts[0].posAfterSeconds(timeToPosition);
	const endDest = [(p2attime[0]+p1attime[0])/2, (p2attime[1]+p1attime[1])/2];
	pt.startPos = [...pt.currPos];
	pt.nextPos = endDest;
	pt.interpolateTime = timeToPosition;
	pt.currTime = 0;
	colFader.addToFades([102, 0, 255], removePtTime);
	window.setTimeout(e=>actuallyRemovePt(), timeToPosition*1000);
}
addToPts();
// pts[0].setPos([.5+.25*Math.sign(Math.random()-.5), .5+.25*Math.sign(Math.random()-.5)])
// pts[1].setPos([.5+.25*Math.sign(Math.random()-.5), .5+.25*Math.sign(Math.random()-.5)])

let fps = 60;
let lastTimeAddedAt = performance.now();
let lastTimeRemovedAt = performance.now();
let reversed = false;
let timeNotLaggy = 2;
let lastTime = performance.now();
const maxRatio = 1/2;
function configCtx()
{
	ctx.canvas.width = window.innerWidth;
	ctx.canvas.height = window.innerHeight;
	ctx.lineWidth = Math.min(ctx.canvas.width, ctx.canvas.height)*.01
	ctx.fillStyle = "#000000";
	ctx.strokeStyle = "rgba(255, 255, 255, 1)";
	ctx.lineCap = "round";
	// ctx.globalCompositeOperation = "difference";
	squareLength = Math.min(ctx.canvas.width, ctx.canvas.height)*.9;
	
}
const loader = document.getElementById('loader');
const ctx = loader.getContext('2d');
let squareLength = 100;
configCtx();
window.addEventListener('resize', e=>
{
	configCtx();
})
let secTime = 0;

const timeForCycle = 2;
let prevTime = performance.now();
function onFrame(time)
{
	let dt = (time-prevTime)*.001;
	prevTime=time;
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	secTime += dt;
	pts.forEach(pt=>pt.update(dt));
	secTime = secTime>=timeForCycle?0:secTime;
	/*if (ctOfPtsToAdd > 0 || addPtInterval)
	{
		colFader.addToFades([0, 255, 102], .25);
	}
	else if (removeQueCt > 0 || currentlyRemovingPt)
	{
		colFader.addToFades([102, 0, 255], .25);
	}
	else 
	{
		colFader.addToFades([255, 255, 255], .1);
	}*/
	colFader.update(dt);
	ctx.strokeStyle = "rgb("+colFader.getColor().join(", ")+")";
	// const ratio = interpolate(secTime<timeForCycle/2?1:1/maxRatio, secTime<timeForCycle/2?1/maxRatio:1, secTime<timeForCycle/2?(secTime*2)/timeForCycle:(secTime*2 - timeForCycle)/timeForCycle);
	const ratio = 1;
	let getPosInPxFunctVals = [ctx.canvas.width*.05, ctx.canvas.width*.9, ctx.canvas.height*.05, ctx.canvas.height*.9,];
	let prevPxPos = pts[pts.length-1].getPosInPx(...getPosInPxFunctVals);
	pts.forEach(pt=>{
		ctx.beginPath();
		ctx.moveTo(...prevPxPos)
		let currPxPos = pt.getPosInPx(...getPosInPxFunctVals);
		ctx.lineTo(...currPxPos)
		ctx.stroke();
		prevPxPos = currPxPos;
	})
	if (debug)
	{
		ctx.beginPath();
		ctx.arc(...debugDot.getPosInPx(...getPosInPxFunctVals), 10, 0, 360)
		ctx.stroke();
		ctx.beginPath();
		if (currentlyRemovingPt)
		{
			ctx.beginPath();
			ctx.arc(...currentlyRemovingPt.getPosInPx(...getPosInPxFunctVals), 10, 0, 360);
			ctx.strokeStyle = "#ff0000";
			ctx.stroke();
			ctx.strokeStyle = "#ffffff";
		}
	}
	window.requestAnimationFrame(onFrame);
}
window.requestAnimationFrame(onFrame);
function reset()
{
	ptStorage.forEach(pt=>pt.reset());
	removeQueCt = 0;
	if (pts.length>2)
	{
		pts.splice(1, pts.length-1);
	}
	else
	{
		showGraphic();
	}
	removeQueCt = 0;
	ctOfPtsToAdd = 0;
}
let ptChangedAt = [0, 0]
const changePerThingy = 0.8;
window.addEventListener("pointermove", e=>
{
	if (down)
	{
		if (magnitude([downAt[0]-e.pageX, downAt[1]-e.pageY])>20)
		{
			window.clearTimeout(resetCountdown);
		}
		if (ptChangedAt[1] - e.pageY>window.innerHeight*.1)
		{
			ptChangedAt[1] = e.pageY;
			addPts(1);
		}
		if (e.pageY - ptChangedAt[1]>window.innerHeight*.1)
		{
			ptChangedAt[1] = e.pageY;
			removeFromPts();
		}
		if (ptChangedAt[0]-e.pageX>window.innerWidth*.1)
		{
			ptChangedAt[0] = e.pageX;
		}
		if (e.pageX - ptChangedAt[0]>window.innerWidth*.1)
		{
			ptChangedAt[0] = e.pageX;
		}
	}
});
window.addEventListener("pointerup", e=>{
	down = false;
	window.clearTimeout(resetCountdown);
	if (magnitude([downAt[0]-e.pageX, downAt[1]-e.pageY])<20)
	{
		if ((performance.now() - timeDown)*.001>1 || pts.length == 1)
		{
			reset();
			return;
		}
		else
		{
			ptStorage.forEach(pt=>pt.reset());
		}
	}
});
let currDeltaY = 0;
window.addEventListener("wheel", e=>
{
	let threshold = e.deltaMode === WheelEvent.DOM_DELTA_PIXEL?100:.1;
	currDeltaY += e.deltaY;
	if (currDeltaY<-threshold)
	{
				while(currDeltaY<-200)
		{
			addPts(1);
			currDeltaY += 100;
		}
	}
	else if (currDeltaY>threshold)
	{
		while(currDeltaY>200)
		{
			removeFromPts();
			currDeltaY -= 100;
		}
	}
})
window.addEventListener("keydown", e=>
{
	if (e.keyCode == 38 || e.key == "w")
	{
		addPts(1);
	}
	else if (e.keyCode == 40 || e.key == "s")
	{
		removeFromPts();
	}
	else if (e.keyCode == 37 || e.key == "a")
	{

	}
	else if (e.keyCode == 39 || e.key == "d")
	{

	}
})
window.addEventListener("keyup", e=>
{
	if (e.keyCode == 38 || e.key == "w")
	{
		ctOfPtsToAdd = 0;
	}
	else if (e.keyCode == 40 || e.key == "s")
	{
		removeQueCt = 0;
	}
})
function addPts(ct)
{
	hideGraphic();
	ctOfPtsToAdd+=ct;
	if (pts.length + ctOfPtsToAdd>maxPts)
	{
		ctOfPtsToAdd = Math.max(0, maxPts - pts.length);
		if (pts.length == maxPts)
		{
			colFader.addToFades([255, 0, 0], .5);
		}
		return;
	}
	removeQueCt = 0;
	if (!addPtInterval)
	{
		actuallyAddPts();
	}
};
function actuallyAddPts()
{
	colFader.addToFades([0, 255, 102], removePtTime);
	if (ctOfPtsToAdd<=0) // if done adding points skip the rest
	{
		addPtInterval = null;
		return;
	}
	addToPts();
	ctOfPtsToAdd--
	if (ctOfPtsToAdd>=0)
	{
		addPtInterval = window.setTimeout(e=>actuallyAddPts(), (removePtTime)*1000);
	}
}
let zoom = .1
function zoomIn(amount)
{
	
}
function zoomOut(amount)
{

}
let addPtInterval;
let ctOfPtsToAdd = 0;
function magnitude(nums)
{
	return Math.sqrt(nums.reduce((prev, current, ind)=>prev+current*current));
}
const downAt = [0, 0];
let timeDown = performance.now();
let down = false;
let resetCountdown = null;
window.addEventListener("pointerdown", e=>
{
	down = true;
	downAt[0] = e.pageX;
	downAt[1] = e.pageY;
	ptChangedAt = [e.pageX, e.pageY];
	timeDown = performance.now();
	resetCountdown = window.setTimeout(e=>
	{
		reset();
	}, 500);
})
