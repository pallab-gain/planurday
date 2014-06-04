/**
 * Created by xerxes on 6/3/14.
 */

var app = angular.module('planurDay', []);

function Task(attrs) {
    var id = (attrs && attrs.id) || undefined;
    var name = (attrs && attrs.name) || undefined;
    var total_duration = parseFloat(attrs && attrs.total_duration) || 0;
    var duration_insec = moment.duration(total_duration, 'hours').asSeconds();
    var duration = attrs.duration || duration_insec;
    var running = attrs.running || false;
    return {
        getId: function () {
            return id;
        },
        getName: function () {
            return name;
        },
        getTotalDuration: function () {
            return total_duration;
        },
        getDuration: function () {
            return duration;
            //return moment.duration(duration, 'seconds').asHours();
        },
        isDone: function () {
            return   duration <= 0 ? true : false
        },
        getComplete: function () {
            var baki_ase = duration_insec - duration;
            return duration <= 0 ? 100 : ( (100. * baki_ase ) / duration_insec );
        },
        getTask: function () {
            return {'id': id, 'name': name, 'total_duration': total_duration, 'duration': duration};
        },
        switchState: function () {
            running = !running
        },
        isRunning: function () {
            return running;
        },
        updateDuration: function () {
            //1 second kore kore kumaitechi
            duration = duration - 1;
        },
        setStop: function () {
            running = false
        }
    }
}

app.factory('TaskList', function ($q) {
    var TaskList = {};
    TaskList.task = [];
    TaskList.addNew = function (attrs) {
        //TaskList.task.push(attrs);
        localStorage.setItem("planurday" + attrs.getId(), JSON.stringify(attrs.getTask()));
    };
    TaskList.newTask = function (task_details) {
        var self = this;
        var tmp_task = task_details.split("#")
        var _task = new Task({
            'id': moment.utc().valueOf(),
            'name': tmp_task[0],
            'total_duration': tmp_task[1],
            'running': false
        });
        self.addNew(_task);
    };
    TaskList.getTask = function (task_id) {
        return localStorage["planurday" + task_id];
    };
    TaskList.updateTask = function (task_id, with_task) {
        localStorage.setItem("planurday" + task_id, JSON.stringify(with_task.getTask()));
    };
    TaskList.allTask = function () {
        var d = $q.defer();
        //return TaskList.task;
        //get a list of task
        var keys, tmp;
        var raw_data = localStorage;
        var data = [];
        async.series([
                function (key_callback) {
                    keys = _.keys(raw_data)
                    key_callback(null);
                },
                function (data_callback) {
                    async.each(keys, function (cur_key, each_callback) {
                        if (cur_key.substr(0, 9) === 'planurday') {
                            data.push(new Task(angular.fromJson(raw_data[cur_key])));
                        }
                        each_callback(null);
                    }, function (err) {
                        data_callback(null);
                    })
                }
            ],
            function (err, done) {
                TaskList.task = data;
                d.resolve();
            });
        return d.promise;
    };

    TaskList.removeTasks = function () {
        var d = $q.defer();
        //return TaskList.task;
        //get a list of task
        var keys;
        var raw_data = localStorage;
        var data = [];
        async.series([
                function (key_callback) {
                    keys = _.keys(raw_data)
                    key_callback(null);
                },
                function (data_callback) {
                    async.each(keys, function (cur_key, each_callback) {
                        if (cur_key.substr(0, 9) === 'planurday') {
                            localStorage.removeItem(cur_key);
                        }
                        each_callback(null);
                    }, function (err) {
                        data_callback(null);
                    })
                }
            ],
            function (err, done) {
                d.resolve();
            });
        return d.promise;
    }
    return TaskList;
});

app.controller('planurDay', function ($scope, $interval, TaskList) {
    $scope.task_list = undefined;
    TaskList.allTask().then(function () {
        $scope.task_list = TaskList.task;
    });
    $scope.set_newtask = true;
    $scope.current_task = undefined;
    var stop = undefined;

    $scope.save_newtask = function () {
        TaskList.newTask($scope.task_details);
        $scope.task_details = undefined;
        //$scope.task_list = TaskList.allTask();
        TaskList.allTask().then(function () {
            $scope.task_list = TaskList.task;
        });
    };
    $scope.on_listen = function (cur_task) {
        if (angular.isDefined(stop)) {
            $scope.stopInterval();
        }
        if (angular.isDefined($scope.current_task) && _.isEqual(cur_task, $scope.current_task) === false) {
            //different task
            $scope.current_task.setStop();
            TaskList.updateTask($scope.current_task.getId(), $scope.current_task);
        }
        //same task
        $scope.current_task = cur_task;
        if ($scope.current_task.isDone() === false) {
            $scope.current_task.switchState();
            if ($scope.current_task.isRunning() === true) {
                stop = $interval(function () {
                    $scope.current_task.updateDuration();
                    $scope.progress_value = $scope.current_task.getComplete();
                    //console.log($scope.current_task.getDuration(), $scope.current_task.getComplete());
                }, 1000);
            } else {
                $scope.current_task.setStop();
                TaskList.updateTask($scope.current_task.getId(), $scope.current_task);
            }
        } else {
            $scope.current_task.setStop();
            TaskList.updateTask($scope.current_task.getId(), $scope.current_task);
        }

    };

    $scope.stopInterval = function () {
        if (angular.isDefined(stop)) {
            $interval.cancel(stop);
            stop = undefined;
        }
    };
    $scope.$on('$destroy', function () {
        // Make sure that the interval is destroyed too
        $scope.stopInterval();
        if (typeof $scope.current_task !== 'undefined') {
            $scope.current_task.setStop();
            TaskList.updateTask($scope.current_task.getId(), $scope.current_task);
        }
    });
    window.onbeforeunload = function (e) {
        $scope.stopInterval();
        if (typeof $scope.current_task !== 'undefined') {
            $scope.current_task.setStop();
            TaskList.updateTask($scope.current_task.getId(), $scope.current_task);
        }
    }
});