const hinter = document.getElementById("hint");
function showGraphic()
{
	if (pts.length == 1)
	{
		if (!hinter.classList.contains("show"))
		{
			hint.scroll(0, 0);
		}
	}
	hinter.classList.toggle("show", true);
	qbtn.classList.toggle('hide', true);
}
function hideGraphic()
{
	hinter.classList.toggle('show', false);
	qbtn.classList.toggle('hide', false);
	configCtx();
}
const hint = document.getElementById("hint");
const left = document.getElementById("left");
const right = document.getElementById("right");
const close = document.getElementById("close");
const qbtn = document.getElementById("qbtn");
right.addEventListener('click', e=>
{
	hint.scroll({
		left: hint.scrollLeft+window.innerWidth,
		right: 0,
		behavior: 'smooth'
	})
	right.blur();
})
left.addEventListener('click', e=>
{
	hint.scroll({
		left: hint.scrollLeft-window.innerWidth,
		right: 0,
		behavior: 'smooth'
	})
	left.blur();
})
close.addEventListener('click', e=>
{
	hideGraphic();
})
qbtn.addEventListener('click', e=>
{
	console.log("HERE");
	showGraphic();
	qbtn.blur();
})
hint.addEventListener("scroll", e=>
{
	updateArrows();
})
function updateArrows()
{
	if (hint.scrollLeft <= hint.offsetWidth/2)
	{
		left.classList.toggle('hide', true);
	}
	else
	{
		left.classList.toggle('hide', false);
	}
	if (hint.scrollLeft + hint.offsetWidth >= hint.scrollWidth-hint.offsetWidth/2)
	{
		right.classList.toggle('hide', true);
	}
	else
	{
		right.classList.toggle('hide', false);
	}
}
updateArrows();