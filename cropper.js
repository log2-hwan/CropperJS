var Cropper = function(url) {
	var _this = this;
	
	var c = document.createElement('canvas');
	c.style.position = 'absolute';
	c.style.top = c.style.left = 0;
	this.el = document.createElement('div');
	this.el.style.position = 'relative';
	this.el.appendChild(c);
	
	this.canvas = c;
	this.ctx = c.getContext('2d');
	this.ics = [];
	this.state = {
		start:{x:0,y:0},
		end:{x:0,y:0},
		flipX:false,
		flipY:false,
		destX:0,
		destY:0,
		moving:false,
		indicator:-1
	};
	
	for(var i=0;i<8;i++) {
		var indicator = document.createElement('div');
		indicator.className = 'cropper-indicator';
		indicator.style.position = 'absolute';
		indicator.style.top = indicator.style.left = 0;
		indicator.style.width = indicator.style.height = '10px';
		indicator.style.background = '#ff0';
		indicator.style.zIndex = 1;
		this.el.appendChild(indicator);
		this.ics.push(indicator);
	}
	
	this.img = new Image();
	this.img.crossOrigin = '';
	this.img.onload = function() {		
		c.width = _this.img.width;
		c.height = _this.img.height;
		_this.width = c.width;
		_this.height = c.height;
	
		_this._bindEvents();
		_this._draw();
	};
	this.img.src = url;
};

Cropper.EVENT = {
	START: {mouse:'mousedown',touch:'touchstart'},
	MOVE: {mouse:'mousemove',touch:'touchmove'},
	END: {mouse:'mouseup',touch:'touchend'}
};

Cropper.prototype._interactEvent = function(target,type,func) {
	var _this = this;

	this.state.moving = false;
	target.addEventListener(type.mouse,function(e) {
		e.preventDefault();
		switch(type.mouse) {
		case 'mousedown':
			_this.state.moving = true;
			break;
		case 'mousemove':
			if(!_this.state.moving) return;
			break;
		case 'mouseup':
			_this.state.moving = false;
			break;
		}
		func(e);
	});
	target.addEventListener(type.touch,function(e) {
		e.preventDefault();
		if(e.touches.length)
			func(e.touches[0]);
	});
};

Cropper.prototype._bindEvents = function() {
	var _this = this;

	this.ics.forEach(function(ind,i) {
		_this._interactEvent(ind,Cropper.EVENT.START,function(e) {
			_this.state.indicator = i;
		});
	});
	
	this._interactEvent(this.canvas,Cropper.EVENT.START,function(e) {
		_this.state.start = _this._getPosition(e);
		_this.state.end = _this.state.start;
		_this.state.flipX = _this.state.flipY = false;
		_this.state.indicator = 8;
	});
	
	this._interactEvent(window,Cropper.EVENT.MOVE,function(e) {
		var pos = _this._getPosition(e);
		var cx = pos.x;
		var cy = pos.y;
		switch(_this.state.indicator) {
		case 0:
			_this.state.start = {x:cx,y:cy};
			break;
		case 1:
			_this.state.start.x = cx;
			break;
		case 2:
			_this.state.start.x = cx;
			_this.state.end.y = cy;
			break;
		case 3:
			_this.state.start.y = cy;
			break;
		case 4:
			_this.state.end.y = cy;
			break;
		case 5:
			_this.state.start.y = cy;
			_this.state.end.x = cx;
			break;
		case 6:
			_this.state.end.x = cx;
			break;
		case 7:
			_this.state.end = {x:cx,y:cy};
			break;
		case 8:
			_this.state.flipX = _this.state.start.x>cx;
			_this.state.flipY = _this.state.start.y>cy;
			_this.state.end = {x:cx,y:cy};
			_this.state.end.x = Math.max(Math.min(_this.width,_this.state.end.x),0);
			_this.state.end.y = Math.max(Math.min(_this.height,_this.state.end.y),0);
			break;
		}
		_this._draw();
	},false);
	
	this._interactEvent(window,Cropper.EVENT.END,function(e) {});
};

Cropper.prototype._getPosition = function(e) {
	var rect = this.el.getBoundingClientRect();
	var cx = e.clientX-rect.left;
	var cy = e.clientY-rect.top;
	return {x:cx,y:cy};
};

Cropper.prototype._draw = function() {
	this.ctx.drawImage(this.img,0,0);
	var s = {x:this.state.flipX?this.state.end.x:this.state.start.x,y:this.state.flipY?this.state.end.y:this.state.start.y};
	var e = {x:!this.state.flipX?this.state.end.x:this.state.start.x,y:!this.state.flipY?this.state.end.y:this.state.start.y};
	this.state.destX = s.x;
	this.state.destY = s.y;
	this.state.width = e.x - s.x;
	this.state.height = e.y - s.y;
	if(this.state.width>5&&this.state.height>5) {
		this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
		this.ctx.fillRect(0,0,this.width,this.height);
	}
	this.ctx.drawImage(this.img,this.state.destX,this.state.destY,this.state.width,this.state.height,this.state.destX,this.state.destY,this.state.width,this.state.height);
	this.ics.forEach(function(n) { n.style.display = 'none'; });
	if(this.state.width>5&&this.state.height>5) {
		this.ics.forEach(function(n) { n.style.display = 'block'; });
		var k = 0;
		for(var i=0;i<3;i++) {
			for(var j=0;j<3;j++) {
				if(i==1&&j==1) continue;
				var idx = k++;
				this.ics[idx].style.webkitTransform = this.ics[idx].style.transform = 'translate3d('+(this.state.destX+i*this.state.width*0.5-5)+'px,'+(this.state.destY+j*this.state.height*0.5-5)+'px,0)';
			}
		}
	}
};

Cropper.prototype.getCroppedBase64 = function() {
	var canvas = document.createElement('canvas');
	canvas.width = this.state.width;
	canvas.height = this.state.height;
	
	var ctx = canvas.getContext('2d');
	ctx.drawImage(this.img,this.state.destX,this.state.destY,this.state.width,this.state.height,0,0,this.state.width,this.state.height);
	
	return canvas.toDataURL('image/png').split(',')[1];
};