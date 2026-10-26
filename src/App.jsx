import { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api/todos';

function App() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // 1. 할 일 목록 조회 (GET)
  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(API_BASE_URL);
      if (!res.ok) throw new Error('서버와 통신할 수 없습니다.');
      const result = await res.json();
      setTodos(result.data || []);
    } catch (err) {
      console.error(err);
      setError('백엔드 서버(포트 5000)가 켜져 있는지 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  // 2. 할 일 추가 (POST)
  const handleAddTodo = async (e) => {
    e.preventDefault();
    const title = inputValue.trim();
    if (!title) return;

    try {
      const res = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error('할 일을 추가하지 못했습니다.');
      
      setInputValue('');
      await fetchTodos();
    } catch (err) {
      alert(err.message);
    }
  };

  // 3. 완료 상태 토글 (PUT)
  const handleToggleComplete = async (id, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentStatus }),
      });
      if (!res.ok) throw new Error('상태를 변경하지 못했습니다.');
      
      await fetchTodos();
    } catch (err) {
      alert(err.message);
    }
  };

  // 4. 할 일 삭제 (DELETE)
  const handleDeleteTodo = async (id) => {
    if (!window.confirm('이 할 일을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('삭제에 실패했습니다.');
      
      await fetchTodos();
    } catch (err) {
      alert(err.message);
    }
  };

  // 5. 수정 모드 시작
  const handleStartEdit = (todo) => {
    setEditingId(todo._id);
    setEditingText(todo.title);
  };

  // 6. 수정 내용 저장 (PUT)
  const handleSaveEdit = async (id) => {
    const title = editingText.trim();
    if (!title) return;

    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error('수정 저장에 실패했습니다.');

      setEditingId(null);
      await fetchTodos();
    } catch (err) {
      alert(err.message);
    }
  };

  // 필터링 적용된 목록
  const filteredTodos = todos.filter((todo) => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.completed).length;
  const activeCount = totalCount - completedCount;

  return (
    <main className="app-container">
      {/* 상단 헤더 */}
      <header className="header">
        <div className="title-group">
          <h1>오늘의 할 일</h1>
          <p>React & Node.js 백엔드 실시간 연동</p>
        </div>
        <span className="badge">MongoDB 연동 중</span>
      </header>

      {/* 통계 카드 */}
      <section className="stats-bar">
        <div className="stat-item">
          <div className="stat-label">전체</div>
          <div className="stat-value">{totalCount}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">진행 중</div>
          <div className="stat-value" style={{ color: '#4f46e5' }}>{activeCount}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">완료됨</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{completedCount}</div>
        </div>
      </section>

      {/* 할 일 입력 폼 */}
      <form className="todo-form" onSubmit={handleAddTodo}>
        <input
          type="text"
          className="input-field"
          placeholder="새로운 할 일을 입력하세요..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button type="submit" className="submit-btn" disabled={!inputValue.trim()}>
          추가
        </button>
      </form>

      {/* 필터 탭 */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          전체 ({totalCount})
        </button>
        <button
          className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          진행 중 ({activeCount})
        </button>
        <button
          className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          완료됨 ({completedCount})
        </button>
      </div>

      {/* 에러 배너 */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button className="retry-btn" onClick={fetchTodos}>다시 시도</button>
        </div>
      )}

      {/* 로딩 표시 */}
      {loading && <div className="loading">할 일 목록을 불러오는 중...</div>}

      {/* 할 일 리스트 */}
      {!loading && (
        <ul className="todo-list">
          {filteredTodos.map((todo) => {
            const isEditing = editingId === todo._id;

            return (
              <li
                key={todo._id}
                className={`todo-item ${todo.completed ? 'completed' : ''}`}
              >
                <div className="todo-main">
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleComplete(todo._id, todo.completed)}
                  />

                  {isEditing ? (
                    <input
                      type="text"
                      className="edit-input"
                      value={editingText}
                      autoFocus
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(todo._id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                  ) : (
                    <span className="todo-text">{todo.title}</span>
                  )}
                </div>

                <div className="action-buttons">
                  {isEditing ? (
                    <>
                      <button
                        className="btn-icon save"
                        onClick={() => handleSaveEdit(todo._id)}
                      >
                        저장
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => setEditingId(null)}
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn-icon"
                        onClick={() => handleStartEdit(todo)}
                      >
                        수정
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={() => handleDeleteTodo(todo._id)}
                      >
                        삭제
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* 빈 상태 */}
      {!loading && filteredTodos.length === 0 && (
        <div className="empty-state">
          <div className="icon">✨</div>
          <p>
            {filter === 'completed'
              ? '완료된 할 일이 아직 없습니다.'
              : filter === 'active'
              ? '진행 중인 할 일이 없습니다. 모두 완료하셨네요!'
              : '할 일이 비어 있습니다. 새로운 할 일을 추가해 보세요!'}
          </p>
        </div>
      )}
    </main>
  );
}

export default App;
